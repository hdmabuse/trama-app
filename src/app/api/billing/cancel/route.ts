import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cancelSubscription } from "@/lib/mercadopago";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "PAST_DUE"] },
    },
  });

  if (!subscription) {
    return NextResponse.json(
      { error: "Nenhuma assinatura ativa encontrada" },
      { status: 404 }
    );
  }

  try {
    await cancelSubscription(subscription.mercadoPagoId);

    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { cancelAtPeriodEnd: true },
    });

    return NextResponse.json({
      message: "Assinatura cancelada",
      accessUntil: subscription.currentPeriodEnd,
    });
  } catch (error) {
    console.error("[BILLING_CANCEL]", error);
    return NextResponse.json(
      { error: "Erro ao cancelar assinatura" },
      { status: 500 }
    );
  }
}
