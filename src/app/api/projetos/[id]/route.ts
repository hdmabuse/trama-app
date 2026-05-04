import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanAccessProject, userOwnsProject } from "@/lib/ownership";
import { updateProjectSchema, parseBody } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const hasAccess = await userCanAccessProject(session.user.id, params.id);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      codes: {
        include: { children: true, _count: { select: { codings: true } } },
        where: { parentId: null },
        orderBy: { name: "asc" },
      },
      owner: { select: { name: true } },
      _count: { select: { documents: true, codes: true } },
    },
  });

  if (!project) return NextResponse.json({ error: "Projeto não encontrado" }, { status: 404 });
  return NextResponse.json(project);
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Apenas o dono pode editar
  const isOwner = await userOwnsProject(session.user.id, params.id);
  if (!isOwner) return NextResponse.json({ error: "Apenas o dono pode editar o projeto" }, { status: 403 });

  const body = await req.json();
  const parsed = parseBody(updateProjectSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const project = await prisma.project.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(project);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  // Apenas o dono pode deletar
  const isOwner = await userOwnsProject(session.user.id, params.id);
  if (!isOwner) return NextResponse.json({ error: "Apenas o dono pode deletar o projeto" }, { status: 403 });

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
