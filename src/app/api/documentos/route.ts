import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { checkPlanLimit } from "@/lib/plans";

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
  const userId = (session.user as any).id;
  const body = await req.json();

  const check = await checkPlanLimit(userId, "documents", body.projectId);
  if (!check.allowed) {
    return NextResponse.json({ error: "PLAN_LIMIT", resource: "documents", current: check.current, limit: check.limit, plan: check.plan }, { status: 403 });
  }

  const wordCount = body.content?.split(/\s+/).filter(Boolean).length || 0;
  const doc = await prisma.document.create({
    data: { title: body.title, content: body.content, type: body.type || "TXT", projectId: body.projectId, wordCount },
  });
  return NextResponse.json(doc, { status: 201 });
}
