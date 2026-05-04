import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendInviteEmail } from "@/lib/email";
import { randomUUID } from "crypto";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const invite = await prisma.adminInvite.findUnique({
    where: { id: params.id },
    include: { invitedBy: { select: { name: true } } },
  });

  if (!invite) return NextResponse.json({ error: "Convite não encontrado" }, { status: 404 });

  if (body.action === "cancel") {
    const updated = await prisma.adminInvite.update({
      where: { id: params.id },
      data: { status: "CANCELLED" },
    });
    return NextResponse.json(updated);
  }

  if (body.action === "resend") {
    // Gerar novo token e nova data de expiração
    const newToken = randomUUID();
    const updated = await prisma.adminInvite.update({
      where: { id: params.id },
      data: {
        status: "PENDING",
        token: newToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // Enviar email
    const emailResult = await sendInviteEmail({
      to: updated.email,
      token: newToken,
      inviterName: invite.invitedBy?.name || session.user.name || "Administrador",
      plan: updated.plan,
      message: updated.message,
    });

    return NextResponse.json({
      ...updated,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    });
  }

  if (body.action === "send_email") {
    // Reenviar email sem alterar o convite
    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Só é possível enviar email para convites pendentes" }, { status: 400 });
    }

    const emailResult = await sendInviteEmail({
      to: invite.email,
      token: invite.token,
      inviterName: invite.invitedBy?.name || session.user.name || "Administrador",
      plan: invite.plan,
      message: invite.message,
    });

    return NextResponse.json({
      ...invite,
      emailSent: emailResult.success,
      emailError: emailResult.error || null,
    });
  }

  if (body.plan) {
    if (invite.status !== "PENDING") {
      return NextResponse.json({ error: "Só é possível alterar convites pendentes" }, { status: 400 });
    }
    const updated = await prisma.adminInvite.update({
      where: { id: params.id },
      data: { plan: body.plan },
    });
    return NextResponse.json(updated);
  }

  return NextResponse.json({ error: "Ação não reconhecida" }, { status: 400 });
}
