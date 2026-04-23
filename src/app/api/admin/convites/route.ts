import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const invites = await prisma.adminInvite.findMany({
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invites);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session?.user as any)?.id;
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const { email, plan, message } = body;
  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return NextResponse.json({ error: "Este email já possui uma conta" }, { status: 409 });

  const pendingInvite = await prisma.adminInvite.findFirst({ where: { email, status: "PENDING" } });
  if (pendingInvite) return NextResponse.json({ error: "Já existe um convite pendente para este email" }, { status: 409 });

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.adminInvite.count({
    where: { invitedById: userId, createdAt: { gte: today } },
  });
  if (todayCount >= 20) return NextResponse.json({ error: "Limite de 20 convites por dia atingido" }, { status: 429 });

  const invite = await prisma.adminInvite.create({
    data: {
      email, plan: plan || "FREE", message: message || null,
      invitedById: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await logActivity(userId, "invite_created", "AdminInvite", invite.id, { email, plan });
  return NextResponse.json(invite, { status: 201 });
}
