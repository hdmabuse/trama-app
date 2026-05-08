import { MercadoPagoConfig, PreApproval, Payment } from "mercadopago";
import { prisma } from "./db";

const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN!,
});

const PLAN_ID_MAP: Record<string, string> = {
  PRO: process.env.MERCADO_PAGO_PLAN_ID_PRO!,
  TEAM: process.env.MERCADO_PAGO_PLAN_ID_TEAM!,
};

const PLAN_PRICES: Record<string, number> = {
  PRO: 3900,
  TEAM: 9900,
};

export async function createSubscriptionCheckout(
  userId: string,
  userEmail: string,
  plan: "PRO" | "TEAM"
) {
  const existing = await prisma.subscription.findFirst({
    where: { userId, status: { in: ["ACTIVE", "PENDING"] } },
  });

  if (existing) {
    throw new Error("USER_ALREADY_HAS_ACTIVE_SUBSCRIPTION");
  }

  const planId = PLAN_ID_MAP[plan];
  if (!planId) {
    throw new Error(`MERCADO_PAGO_PLAN_ID_NOT_CONFIGURED_FOR_${plan}`);
  }

  const preapproval = new PreApproval(client);
  const result = await preapproval.create({
    body: {
      preapproval_plan_id: planId,
      payer_email: userEmail,
      reason: `Assinatura Trama ${plan}`,
      external_reference: userId,
      auto_recurring: {
        frequency: 1,
        frequency_type: "months",
        transaction_amount: PLAN_PRICES[plan] / 100,
        currency_id: "BRL",
      },
      back_url: `${process.env.NEXT_PUBLIC_APP_URL}/billing/success`,
      status: "pending",
    },
  });

  return {
    initPoint: result.init_point!,
    planId,
    price: PLAN_PRICES[plan],
    mercadoPagoPreapprovalId: result.id!,
  };
}

export async function cancelSubscription(mercadoPagoId: string) {
  const preapproval = new PreApproval(client);
  return preapproval.update({
    id: mercadoPagoId,
    body: { status: "cancelled" },
  });
}

export async function processSubscriptionAuthorized(
  preapproval: {
    id: string;
    external_reference: string;
    preapproval_plan_id: string;
    status: string;
  }
) {
  const userId = preapproval.external_reference;
  if (!userId) return;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return;

  const plan = Object.entries(PLAN_ID_MAP).find(
    ([, id]) => id === preapproval.preapproval_plan_id
  )?.[0] as "PRO" | "TEAM" | undefined;

  if (!plan) return;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.subscription.create({
    data: {
      userId,
      plan,
      status: "ACTIVE",
      mercadoPagoId: preapproval.id,
      mercadoPagoPlanId: preapproval.preapproval_plan_id,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
    },
  });

  await prisma.user.update({
    where: { id: userId },
    data: { plan },
  });
}

export async function processSubscriptionCancelled(
  preapproval: { id: string }
) {
  const subscription = await prisma.subscription.findUnique({
    where: { mercadoPagoId: preapproval.id },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      status: "CANCELLED",
      cancelAtPeriodEnd: true,
    },
  });
}

export async function processSubscriptionSuspended(
  preapproval: { id: string }
) {
  const subscription = await prisma.subscription.findUnique({
    where: { mercadoPagoId: preapproval.id },
  });

  if (!subscription) return;

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: { status: "PAST_DUE" },
  });
}

export async function processPaymentCreated(
  payment: {
    id: number;
    subscription_id: string;
    transaction_amount: number;
    currency_id: string;
    status: string;
    payment_method_id: string;
    installments: number;
    card: { last_four?: string };
    transaction_details: { external_resource_url?: string };
    date_approved: string;
  }
) {
  const subscription = await prisma.subscription.findUnique({
    where: { mercadoPagoId: payment.subscription_id },
  });

  if (!subscription) return;

  const existing = await prisma.payment.findUnique({
    where: { mercadoPagoPaymentId: String(payment.id) },
  });

  if (existing) return;

  const now = new Date();
  const periodEnd = new Date(now);
  periodEnd.setMonth(periodEnd.getMonth() + 1);

  await prisma.payment.create({
    data: {
      subscriptionId: subscription.id,
      mercadoPagoPaymentId: String(payment.id),
      amount: Math.round(payment.transaction_amount * 100),
      currency: payment.currency_id || "BRL",
      status: payment.status,
      paymentMethod: payment.payment_method_id,
      installments: payment.installments,
      cardLast4: payment.card?.last_four,
      receiptUrl: payment.transaction_details?.external_resource_url,
      transactionDate: payment.date_approved
        ? new Date(payment.date_approved)
        : now,
    },
  });

  await prisma.subscription.update({
    where: { id: subscription.id },
    data: {
      lastPaymentId: String(payment.id),
      lastPaymentStatus: payment.status,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      status: payment.status === "approved" ? "ACTIVE" : "PAST_DUE",
    },
  });

  if (payment.status === "approved") {
    const plan = subscription.plan as "PRO" | "TEAM";
    await prisma.user.update({
      where: { id: subscription.userId },
      data: { plan },
    });
  }
}

export async function processPaymentUpdated(
  payment: {
    id: number;
    subscription_id: string;
    status: string;
  }
) {
  const existing = await prisma.payment.findUnique({
    where: { mercadoPagoPaymentId: String(payment.id) },
  });

  if (!existing) return;

  await prisma.payment.update({
    where: { id: existing.id },
    data: { status: payment.status },
  });

  if (payment.status === "rejected" || payment.status === "cancelled") {
    const subscription = await prisma.subscription.findUnique({
      where: { mercadoPagoId: payment.subscription_id },
    });

    if (subscription) {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: { lastPaymentStatus: payment.status, status: "PAST_DUE" },
      });
    }
  }
}

export function getPlanPrice(plan: "PRO" | "TEAM"): number {
  return PLAN_PRICES[plan];
}

export function getPlanId(plan: "PRO" | "TEAM"): string {
  return PLAN_ID_MAP[plan];
}
