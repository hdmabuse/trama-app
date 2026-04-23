import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId obrigatório" }, { status: 400 });

  const codings = await prisma.coding.findMany({
    where: { documentId },
    include: { code: true, author: { select: { name: true } } },
    orderBy: { startOffset: "asc" },
  });

  return NextResponse.json(codings);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const userId = (session.user as any).id;
  const body = await req.json();

  const coding = await prisma.coding.create({
    data: {
      documentId: body.documentId,
      codeId: body.codeId,
      authorId: userId,
      startOffset: body.startOffset,
      endOffset: body.endOffset,
      selectedText: body.selectedText,
      memo: body.memo || null,
    },
    include: { code: true },
  });

  return NextResponse.json(coding, { status: 201 });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id obrigatório" }, { status: 400 });

  await prisma.coding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
