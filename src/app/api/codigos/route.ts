import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId obrigatório" }, { status: 400 });

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

  const code = await prisma.code.create({
    data: {
      name: body.name,
      color: body.color || "#6366f1",
      description: body.description || null,
      projectId: body.projectId,
      parentId: body.parentId || null,
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

  await prisma.code.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
