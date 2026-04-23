import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      documents: { orderBy: { createdAt: "desc" } },
      codes: { include: { children: true, _count: { select: { codings: true } } }, where: { parentId: null }, orderBy: { name: "asc" } },
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

  const body = await req.json();
  const project = await prisma.project.update({
    where: { id: params.id },
    data: { name: body.name, description: body.description, color: body.color },
  });

  return NextResponse.json(project);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  await prisma.project.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
