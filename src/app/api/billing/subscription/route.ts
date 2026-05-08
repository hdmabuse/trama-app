import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "PAST_DUE", "CANCELLED"] },
    },
    orderBy: { createdAt: "desc" },
    include: {
      payments: {
        orderBy: { createdAt: "desc" },
        take: 10,
      },
    },
  });

  if (!subscription) {
    return NextResponse.json({ subscription: null });
  }

  const lastPayment = subscription.payments[0] || null;

  return NextResponse.json({
    subscription: {
      plan: subscription.plan,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      currentPeriodStart: subscription.currentPeriodStart,
      cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
      lastPayment: lastPayment
        ? {
            amount: lastPayment.amount,
            status: lastPayment.status,
            date: lastPayment.transactionDate,
            method: lastPayment.paymentMethod,
            cardLast4: lastPayment.cardLast4,
          }
        : null,
      payments: subscription.payments.map((p) => ({
        id: p.id,
        amount: p.amount,
        status: p.status,
        date: p.transactionDate,
        method: p.paymentMethod,
        cardLast4: p.cardLast4,
        receiptUrl: p.receiptUrl,
      })),
    },
  });
}
