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
  const wordCount = body.content?.split(/\s+/).filter(Boolean).length || 0;

  const doc = await prisma.document.create({
    data: {
      title: body.title,
      content: body.content,
      type: body.type || "TXT",
      projectId: body.projectId,
      wordCount,
    },
  });

  return NextResponse.json(doc, { status: 201 });
}
