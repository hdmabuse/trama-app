import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const body = await req.json();
  const codeIds: string[] = body.codeIds || [];

  const created = await Promise.all(
    codeIds.map((codeId: string) =>
      prisma.themeCode.upsert({
        where: { themeId_codeId: { themeId: params.id, codeId } },
        create: { themeId: params.id, codeId },
        update: {},
      })
    )
  );

  return NextResponse.json({ count: created.length }, { status: 201 });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const codeId = searchParams.get("codeId");

  if (codeId) {
    await prisma.themeCode.deleteMany({ where: { themeId: params.id, codeId } });
  } else {
    await prisma.themeCode.deleteMany({ where: { themeId: params.id } });
  }

  return NextResponse.json({ ok: true });
}
