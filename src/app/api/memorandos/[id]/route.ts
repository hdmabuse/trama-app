import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateMemoSchema, parseBody } from "@/lib/validations";

async function getMemoWithProject(id: string) {
  return prisma.document.findUnique({
    where: { id, type: "MEMO" },
    select: {
      id: true,
      content: true,
      project: { select: { ownerId: true } },
    },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const memo = await getMemoWithProject(params.id);
  if (!memo) return NextResponse.json({ error: "Memorando não encontrado" }, { status: 404 });
  if (memo.project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parseBody(updateMemoSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;
  const newContent = data.content ?? memo.content;
  const wordCount = newContent.split(/\s+/).filter(Boolean).length;

  // Se o conteúdo mudou, invalidar codificações que não correspondem mais
  if (data.content && data.content !== memo.content) {
    const codings = await prisma.coding.findMany({
      where: { documentId: params.id },
      select: { id: true, startOffset: true, endOffset: true, selectedText: true },
    });

    const invalidIds = codings
      .filter((c) => {
        // Offset fora dos limites do novo texto
        if (c.endOffset > data.content!.length) return true;
        // Trecho no offset não corresponde mais
        const currentSlice = data.content!.slice(c.startOffset, c.endOffset);
        return currentSlice !== c.selectedText;
      })
      .map((c) => c.id);

    if (invalidIds.length > 0) {
      await prisma.coding.deleteMany({ where: { id: { in: invalidIds } } });
    }
  }

  const updated = await prisma.document.update({
    where: { id: params.id },
    data: {
      ...(data.title && { title: data.title }),
      ...(data.content && { content: data.content }),
      wordCount,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const memo = await getMemoWithProject(params.id);
  if (!memo) return NextResponse.json({ error: "Memorando não encontrado" }, { status: 404 });
  if (memo.project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.document.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
