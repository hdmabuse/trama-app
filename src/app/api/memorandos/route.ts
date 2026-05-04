import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanAccessProject } from "@/lib/ownership";
import { checkPlanLimit } from "@/lib/plans";
import { createMemoSchema, parseBody } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const linkedDocumentId = searchParams.get("linkedDocumentId");

  if (!projectId) return NextResponse.json({ error: "projectId obrigatório" }, { status: 400 });

  const hasAccess = await userCanAccessProject(session.user.id, projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const where: any = { projectId, type: "MEMO" };
  if (linkedDocumentId) where.linkedDocumentId = linkedDocumentId;

  const memos = await prisma.document.findMany({
    where,
    select: {
      id: true,
      title: true,
      content: true,
      wordCount: true,
      createdAt: true,
      updatedAt: true,
      linkedDocumentId: true,
      linkedDocument: { select: { id: true, title: true } },
      _count: { select: { codings: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(memos);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = parseBody(createMemoSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;

  const hasAccess = await userCanAccessProject(session.user.id, data.projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  // Verificar que o documento vinculado pertence ao mesmo projeto
  if (data.linkedDocumentId) {
    const linked = await prisma.document.findFirst({
      where: { id: data.linkedDocumentId, projectId: data.projectId },
      select: { id: true },
    });
    if (!linked) return NextResponse.json({ error: "Documento vinculado não encontrado neste projeto" }, { status: 400 });
  }

  const check = await checkPlanLimit(session.user.id, "documents", data.projectId);
  if (!check.allowed) {
    return NextResponse.json(
      { error: "PLAN_LIMIT", resource: "documents", current: check.current, limit: check.limit, plan: check.plan },
      { status: 403 }
    );
  }

  const wordCount = data.content.split(/\s+/).filter(Boolean).length;

  const memo = await prisma.document.create({
    data: {
      title: data.title,
      content: data.content,
      type: "MEMO",
      projectId: data.projectId,
      linkedDocumentId: data.linkedDocumentId || null,
      wordCount,
    },
  });

  return NextResponse.json(memo, { status: 201 });
}
