import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanAccessDocument } from "@/lib/ownership";
import { createCodingSchema, parseBody } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const documentId = searchParams.get("documentId");
  if (!documentId) return NextResponse.json({ error: "documentId obrigatório" }, { status: 400 });

  // Verificar acesso ao documento
  const hasAccess = await userCanAccessDocument(session.user.id, documentId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

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

  const body = await req.json();
  const parsed = parseBody(createCodingSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;

  // Verificar acesso ao documento
  const hasAccess = await userCanAccessDocument(session.user.id, data.documentId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const coding = await prisma.coding.create({
    data: {
      documentId: data.documentId,
      codeId: data.codeId,
      authorId: session.user.id,
      startOffset: data.startOffset,
      endOffset: data.endOffset,
      selectedText: data.selectedText,
      memo: data.memo || null,
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

  // Verificar que o coding existe e pertence a um projeto que o usuário acessa
  const coding = await prisma.coding.findUnique({
    where: { id },
    select: {
      authorId: true,
      document: {
        select: {
          project: {
            select: { ownerId: true },
          },
        },
      },
    },
  });

  if (!coding) return NextResponse.json({ error: "Codificação não encontrada" }, { status: 404 });

  // Permitir deleção se é o autor da codificação OU o dono do projeto
  const isAuthor = coding.authorId === session.user.id;
  const isOwner = coding.document.project.ownerId === session.user.id;
  if (!isAuthor && !isOwner) {
    return NextResponse.json({ error: "Sem permissão para deletar esta codificação" }, { status: 403 });
  }

  await prisma.coding.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
