import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPlanLimit } from "@/lib/plans";
import { logActivity } from "@/lib/activity";
import { createProjectSchema, parseBody } from "@/lib/validations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: session.user.id }, { members: { some: { userId: session.user.id } } }],
    },
    include: {
      _count: { select: { documents: true, codes: true } },
      owner: { select: { name: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = parseBody(createProjectSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;

  const check = await checkPlanLimit(session.user.id, "projects");
  if (!check.allowed) {
    return NextResponse.json(
      { error: "PLAN_LIMIT", resource: "projects", current: check.current, limit: check.limit, plan: check.plan },
      { status: 403 }
    );
  }

  const project = await prisma.project.create({
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      ownerId: session.user.id,
      members: { create: { userId: session.user.id, role: "OWNER" } },
    },
  });

  await logActivity(session.user.id, "project_created", "Project", project.id, { name: data.name });
  return NextResponse.json(project, { status: 201 });
}
