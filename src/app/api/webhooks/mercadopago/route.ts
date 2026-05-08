import { NextRequest, NextResponse } from "next/server";
import {
  processPaymentCreated,
  processPaymentUpdated,
  processSubscriptionAuthorized,
  processSubscriptionCancelled,
  processSubscriptionSuspended,
} from "@/lib/mercadopago";

const WEBHOOK_SECRET = process.env.MERCADO_PAGO_WEBHOOK_SECRET;

function verifySignature(
  headers: Headers,
  body: string
): boolean {
  if (!WEBHOOK_SECRET) return false;

  const xSignature = headers.get("x-signature");
  const xRequestId = headers.get("x-request-id");

  if (!xSignature) return false;

  const parts = Object.fromEntries(
    xSignature.split(",").map((s) => s.split("=", 2))
  );

  const ts = parts.ts;
  const v1 = parts.v1;

  if (!ts || !v1) return false;

  const manifest = `id:${xRequestId};request-id:${xRequestId || ""};ts:${ts};`;
  const payload = manifest + body;

  const crypto = require("crypto");
  const hmac = crypto.createHmac("sha256", WEBHOOK_SECRET);
  hmac.update(payload);
  const computed = hmac.digest("hex");

  return computed === v1;
}

export async function POST(req: NextRequest) {
  const body = await req.text();

  if (!verifySignature(req.headers, body)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const searchParams = req.nextUrl.searchParams;

  const topic = searchParams.get("topic") || searchParams.get("type");
  const id = searchParams.get("id") || searchParams.get("data.id");

  if (!topic) {
    return NextResponse.json({ error: "Missing topic" }, { status: 400 });
  }

  if (topic === "payment" && id) {
    return NextResponse.json({ status: "ok" }, { status: 200 });
  }

  let parsedBody;
  try {
    parsedBody = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const type = parsedBody.type;

    switch (type) {
      case "subscription_preapproval_authorized":
      case "subscription_preapproval_created":
        await processSubscriptionAuthorized({
          id: parsedBody.data?.id || parsedBody.id,
          external_reference: parsedBody.data?.external_reference,
          preapproval_plan_id: parsedBody.data?.preapproval_plan_id,
          status: parsedBody.data?.status,
        });
        break;

      case "subscription_preapproval_cancelled":
      case "subscription_preapproval_deactivated":
        await processSubscriptionCancelled({
          id: parsedBody.data?.id || parsedBody.id,
        });
        break;

      case "subscription_preapproval_suspended":
        await processSubscriptionSuspended({
          id: parsedBody.data?.id || parsedBody.id,
        });
        break;

      case "payment":
        const payment = parsedBody.data;
        if (payment.status === "approved") {
          await processPaymentCreated({
            id: payment.id,
            subscription_id: payment.subscription_id || payment.order?.id,
            transaction_amount: payment.transaction_amount,
            currency_id: payment.currency_id,
            status: payment.status,
            payment_method_id: payment.payment_method_id,
            installments: payment.installments,
            card: payment.card,
            transaction_details: payment.transaction_details,
            date_approved: payment.date_approved,
          });
        }
        break;

      default:
        console.log("[MP_WEBHOOK] Unhandled event type:", type);
    }

    return NextResponse.json({ status: "ok" }, { status: 200 });
  } catch (error) {
    console.error("[MP_WEBHOOK] Error processing event:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ status: "ok" });
}
