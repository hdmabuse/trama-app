import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { userCanAccessProject } from "@/lib/ownership";
import { createThemeSchema, parseBody } from "@/lib/validations";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "projectId obrigatório" }, { status: 400 });

  const hasAccess = await userCanAccessProject(session.user.id, projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const themes = await prisma.theme.findMany({
    where: { projectId },
    include: {
      themeCodes: {
        include: { code: { include: { _count: { select: { codings: true } } } } },
      },
    },
    orderBy: { sortOrder: "asc" },
  });

  return NextResponse.json(themes);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = await req.json();
  const parsed = parseBody(createThemeSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { data } = parsed;

  const hasAccess = await userCanAccessProject(session.user.id, data.projectId);
  if (!hasAccess) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const existing = await prisma.theme.findFirst({
    where: { projectId: data.projectId, name: data.name },
  });
  if (existing) return NextResponse.json({ error: "Tema com este nome já existe" }, { status: 409 });

  const maxOrder = await prisma.theme.findFirst({
    where: { projectId: data.projectId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const theme = await prisma.theme.create({
    data: {
      name: data.name,
      description: data.description || null,
      color: data.color,
      projectId: data.projectId,
      sortOrder: (maxOrder?.sortOrder ?? -1) + 1,
    },
  });

  return NextResponse.json(theme, { status: 201 });
}
