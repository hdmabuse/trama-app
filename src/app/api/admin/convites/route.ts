import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendInviteEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const invites = await prisma.adminInvite.findMany({
    include: { invitedBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(invites);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const userId = session.user.id;
  const body = await req.json();
  const { email, plan, message } = body;

  if (!email) return NextResponse.json({ error: "Email obrigatório" }, { status: 400 });

  // Verificar se já existe conta
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return NextResponse.json({ error: "Este email já possui uma conta" }, { status: 409 });

  // Verificar convite pendente
  const pendingInvite = await prisma.adminInvite.findFirst({ where: { email, status: "PENDING" } });
  if (pendingInvite) return NextResponse.json({ error: "Já existe um convite pendente para este email" }, { status: 409 });

  // Limite diário
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayCount = await prisma.adminInvite.count({
    where: { invitedById: userId, createdAt: { gte: today } },
  });
  if (todayCount >= 20) return NextResponse.json({ error: "Limite de 20 convites por dia atingido" }, { status: 429 });

  // Criar convite
  const invite = await prisma.adminInvite.create({
    data: {
      email,
      plan: plan || "FREE",
      message: message || null,
      invitedById: userId,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  // Enviar email
  const emailResult = await sendInviteEmail({
    to: email,
    token: invite.token,
    inviterName: session.user.name || "Administrador",
    plan: invite.plan,
    message: invite.message,
  });

  await logActivity(userId, "invite_created", "AdminInvite", invite.id, {
    email,
    plan,
    emailSent: emailResult.success,
  });

  return NextResponse.json(
    {
      ...invite,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    },
    { status: 201 }
  );
}
