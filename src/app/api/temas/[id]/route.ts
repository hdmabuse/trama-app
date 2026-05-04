import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { updateThemeSchema, parseBody } from "@/lib/validations";

async function getThemeProject(themeId: string) {
  return prisma.theme.findUnique({
    where: { id: themeId },
    select: { project: { select: { ownerId: true, id: true } } },
  });
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const themeProject = await getThemeProject(params.id);
  if (!themeProject) return NextResponse.json({ error: "Tema não encontrado" }, { status: 404 });
  if (themeProject.project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  const body = await req.json();
  const parsed = parseBody(updateThemeSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const theme = await prisma.theme.update({
    where: { id: params.id },
    data: parsed.data,
  });

  return NextResponse.json(theme);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const themeProject = await getThemeProject(params.id);
  if (!themeProject) return NextResponse.json({ error: "Tema não encontrado" }, { status: 404 });
  if (themeProject.project.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Sem permissão" }, { status: 403 });
  }

  await prisma.theme.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
