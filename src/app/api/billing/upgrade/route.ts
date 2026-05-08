import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createSubscriptionCheckout, cancelSubscription } from "@/lib/mercadopago";

const PLAN_HIERARCHY: Record<string, number> = {
  FREE: 0,
  PRO: 1,
  TEAM: 2,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const targetPlan = body.plan as "PRO" | "TEAM";

  if (!targetPlan || !["PRO", "TEAM"].includes(targetPlan)) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const currentSubscription = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "PENDING"] },
    },
  });

  if (currentSubscription) {
    const currentLevel = PLAN_HIERARCHY[currentSubscription.plan] || 0;
    const targetLevel = PLAN_HIERARCHY[targetPlan];

    if (targetLevel <= currentLevel) {
      return NextResponse.json(
        { error: "Plano selecionado não é um upgrade" },
        { status: 400 }
      );
    }

    await cancelSubscription(currentSubscription.mercadoPagoId);

    await prisma.subscription.update({
      where: { id: currentSubscription.id },
      data: { status: "CANCELLED", cancelAtPeriodEnd: true },
    });
  }

  try {
    const userEmail = session.user.email || "";
    const result = await createSubscriptionCheckout(
      session.user.id,
      userEmail,
      targetPlan
    );

    return NextResponse.json({
      checkoutUrl: result.initPoint,
      planId: result.planId,
      price: result.price,
    });
  } catch (error) {
    console.error("[BILLING_UPGRADE]", error);
    return NextResponse.json(
      { error: "Erro ao processar upgrade" },
      { status: 500 }
    );
  }
}
