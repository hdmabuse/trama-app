import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { registerSchema } from "@/lib/validations";

export async function GET(_: Request, { params }: { params: { token: string } }) {
  const invite = await prisma.adminInvite.findUnique({ where: { token: params.token } });
  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });
  if (invite.status !== "PENDING") return NextResponse.json({ error: "Convite já utilizado ou cancelado", status: invite.status }, { status: 410 });
  if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Convite expirado", status: "EXPIRED" }, { status: 410 });

  const inviter = await prisma.user.findUnique({ where: { id: invite.invitedById }, select: { name: true } });
  return NextResponse.json({ email: invite.email, plan: invite.plan, message: invite.message, inviterName: inviter?.name });
}

export async function POST(req: Request, { params }: { params: { token: string } }) {
  const invite = await prisma.adminInvite.findUnique({ where: { token: params.token } });
  if (!invite || invite.status !== "PENDING" || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Convite inválido ou expirado" }, { status: 410 });
  }

  const body = await req.json();
  const { name, password } = body;

  // Usa o mesmo schema de validação do registro para garantir senha forte
  const passwordCheck = registerSchema.shape.password.safeParse(password);
  if (!name || !passwordCheck.success) {
    const msg = !name
      ? "Nome obrigatório"
      : passwordCheck.error!.issues.map((i) => i.message).join("; ");
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email: invite.email, passwordHash, plan: invite.plan, isActive: true },
  });

  await prisma.adminInvite.update({
    where: { id: invite.id },
    data: { status: "ACCEPTED", acceptedAt: new Date() },
  });

  await logActivity(user.id, "account_created_via_invite", "User", user.id, { plan: invite.plan });
  return NextResponse.json({ id: user.id, email: user.email, plan: user.plan }, { status: 201 });
}
