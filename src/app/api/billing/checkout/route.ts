import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createSubscriptionCheckout } from "@/lib/mercadopago";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const body = await req.json();
  const plan = body.plan as "PRO" | "TEAM";

  if (!plan || !PLAN_ID_MAP[plan]) {
    return NextResponse.json({ error: "Plano inválido" }, { status: 400 });
  }

  const existing = await prisma.subscription.findFirst({
    where: {
      userId: session.user.id,
      status: { in: ["ACTIVE", "PENDING"] },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Já existe uma assinatura ativa" },
      { status: 400 }
    );
  }

  try {
    const userEmail = session.user.email || "";
    const result = await createSubscriptionCheckout(
      session.user.id,
      userEmail,
      plan
    );

    return NextResponse.json({
      checkoutUrl: result.initPoint,
      planId: result.planId,
      price: result.price,
      mercadoPagoPreapprovalId: result.mercadoPagoPreapprovalId,
    });
  } catch (error) {
    console.error("[BILLING_CHECKOUT]", error);
    return NextResponse.json(
      { error: "Erro ao criar checkout" },
      { status: 500 }
    );
  }
}

const PLAN_ID_MAP: Record<string, string> = {
  PRO: process.env.MERCADO_PAGO_PLAN_ID_PRO || "",
  TEAM: process.env.MERCADO_PAGO_PLAN_ID_TEAM || "",
};
