import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPlanLimit } from "@/lib/plans";
import { userCanAccessProject } from "@/lib/ownership";
import { createDocumentSchema, parseBody } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId obrigatório" }, { status: 400 });

  const hasAccess = await userCanAccessProject(session.user.id, projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const docs = await prisma.document.findMany({
    where: { projectId },
    include: { _count: { select: { codings: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(docs);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = parseBody(createDocumentSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;

  const hasAccess = await userCanAccessProject(session.user.id, data.projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const check = await checkPlanLimit(session.user.id, "documents", data.projectId);
  if (!check.allowed) {
    return NextResponse.json(
      { error: "PLAN_LIMIT", resource: "documents", current: check.current, limit: check.limit, plan: check.plan },
      { status: 403 }
    );
  }

  const wordCount = data.content.split(/\s+/).filter(Boolean).length;
  const doc = await prisma.document.create({
    data: {
      title: data.title,
      content: data.content,
      type: data.type,
      projectId: data.projectId,
      wordCount,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
