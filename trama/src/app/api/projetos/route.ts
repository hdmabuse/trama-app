import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPlanLimit } from "@/lib/plans";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const userId = (session.user as any).id;

  const projects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    include: { _count: { select: { documents: true, codes: true } }, owner: { select: { name: true } } },
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const userId = (session.user as any).id;
  const body = await req.json();

  const check = await checkPlanLimit(userId, "projects");
  if (!check.allowed) {
    return NextResponse.json({ error: "PLAN_LIMIT", resource: "projects", current: check.current, limit: check.limit, plan: check.plan }, { status: 403 });
  }

  const project = await prisma.project.create({
    data: { name: body.name, description: body.description || null, color: body.color || "#6366f1", ownerId: userId,
      members: { create: { userId, role: "OWNER" } } },
  });

  await logActivity(userId, "project_created", "Project", project.id, { name: body.name });
  return NextResponse.json(project, { status: 201 });
}
