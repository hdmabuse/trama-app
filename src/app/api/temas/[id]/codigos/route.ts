import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { themeCodesSchema, parseBody } from "@/lib/validations";

async function getThemeOwner(themeId: string) {
  const theme = await prisma.theme.findUnique({
    where: { id: themeId },
    select: { project: { select: { ownerId: true } } },
  });
  return theme?.project.ownerId ?? null;
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const ownerId = await getThemeOwner(params.id);
  if (!ownerId) return NextResponse.json({ error: "Tema não encontrado" }, { status: 404 });
  if (ownerId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const body = await req.json();
  const parsed = parseBody(themeCodesSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const created = await Promise.all(
    parsed.data.codeIds.map((codeId: string) =>
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

  const ownerId = await getThemeOwner(params.id);
  if (!ownerId) return NextResponse.json({ error: "Tema não encontrado" }, { status: 404 });
  if (ownerId !== session.user.id) return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const codeId = searchParams.get("codeId");

  if (codeId) {
    await prisma.themeCode.deleteMany({ where: { themeId: params.id, codeId } });
  } else {
    await prisma.themeCode.deleteMany({ where: { themeId: params.id } });
  }

  return NextResponse.json({ ok: true });
}
