import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanAccessProject } from "@/lib/ownership";
import { createCodeSchema, parseBody } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId obrigatório" }, { status: 400 });

  const hasAccess = await userCanAccessProject(session.user.id, projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const codes = await prisma.code.findMany({
    where: { projectId, parentId: null },
    include: { children: true, _count: { select: { codings: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(codes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = parseBody(createCodeSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;

  const hasAccess = await userCanAccessProject(session.user.id, data.projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const code = await prisma.code.create({
    data: {
      name: data.name,
      color: data.color,
      description: data.description || null,
      projectId: data.projectId,
      parentId: data.parentId || null,
    },
  });

  return NextResponse.json(code, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  // Verificar que o código pertence a um projeto do usuário
  const code = await prisma.code.findUnique({
    where: { id },
    select: { project: { select: { ownerId: true } } },
  });

  if (!code) return NextResponse.json({ error: "Código não encontrado" }, { status: 404 });

  const hasAccess = await userCanAccessProject(session.user.id, id);
  const isOwner = code.project.ownerId === session.user.id;
  if (!isOwner) {
    return NextResponse.json({ error: "Apenas o dono do projeto pode deletar códigos" }, { status: 403 });
  }

  await prisma.code.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
