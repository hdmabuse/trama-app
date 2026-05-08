import { describe, it, expect, beforeEach } from "vitest";
import {
  processSubscriptionAuthorized,
  processSubscriptionCancelled,
  processSubscriptionSuspended,
  processPaymentCreated,
} from "@/lib/mercadopago";
import { NextRequest } from "next/server";
import crypto from "crypto";

const TEST_WEBHOOK_SECRET = "test-webhook-secret-123";

function signBody(body: string, requestId: string): string {
  const ts = String(Math.floor(Date.now() / 1000));
  const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
  const payload = manifest + body;
  const hmac = crypto.createHmac("sha256", TEST_WEBHOOK_SECRET);
  hmac.update(payload);
  const v1 = hmac.digest("hex");
  return JSON.stringify({ ts, v1, xRequestId: requestId });
}

function webhookRequest(
  body: unknown,
  params: Record<string, string> = {},
  options: { sign?: boolean } = {},
): NextRequest {
  const qs = new URLSearchParams(params).toString();
  const url = `http://localhost/api/webhooks/mercadopago${qs ? "?" + qs : ""}`;
  const bodyStr = JSON.stringify(body);

  const headers: Record<string, string> = { "Content-Type": "application/json" };

  if (options.sign) {
    const requestId = "req-" + Math.random().toString(36).slice(2);
    const ts = String(Math.floor(Date.now() / 1000));
    const manifest = `id:${requestId};request-id:${requestId};ts:${ts};`;
    const payload = manifest + bodyStr;
    const hmac = crypto.createHmac("sha256", TEST_WEBHOOK_SECRET);
    hmac.update(payload);
    const v1 = hmac.digest("hex");
    headers["x-signature"] = `ts=${ts},v1=${v1}`;
    headers["x-request-id"] = requestId;
  }

  return new NextRequest(url, {
    method: "POST",
    headers,
    body: bodyStr,
  });
}

/**
 * Como MERCADO_PAGO_WEBHOOK_SECRET é lido no topo do módulo como const,
 * precisamos re-importar o módulo com a env var configurada.
 */
describe("POST /api/webhooks/mercadopago", () => {
  let POST: (req: NextRequest) => Promise<Response>;
  let GET: () => Promise<Response>;

  beforeEach(async () => {
    vi.clearAllMocks();
    // Configura a env var ANTES de importar o módulo
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", TEST_WEBHOOK_SECRET);
    // Re-importa o módulo para que ele leia o novo valor da env var
    vi.resetModules();
    const mod = await import("@/app/api/webhooks/mercadopago/route");
    POST = mod.POST;
    GET = mod.GET;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("GET retorna status ok (healthcheck)", async () => {
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });

  it("retorna 401 sem assinatura válida", async () => {
    const req = webhookRequest({}, { topic: "subscription" });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 401 com assinatura inválida", async () => {
    const url = "http://localhost/api/webhooks/mercadopago?topic=subscription";
    const req = new NextRequest(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-signature": "ts=123,v1=invalidsignature",
        "x-request-id": "req-1",
      },
      body: JSON.stringify({ type: "test" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("retorna 400 sem topic (com assinatura válida)", async () => {
    const req = webhookRequest({}, {}, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("retorna 200 para topic=payment com id (shortcut, assinado)", async () => {
    const req = webhookRequest({}, { topic: "payment", id: "123" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });

  it("processa subscription_preapproval_authorized", async () => {
    const body = {
      type: "subscription_preapproval_authorized",
      data: {
        id: "sub-123",
        external_reference: "user-1",
        preapproval_plan_id: "plan-pro",
        status: "authorized",
      },
    };
    const req = webhookRequest(body, { topic: "subscription" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(processSubscriptionAuthorized).toHaveBeenCalledWith({
      id: "sub-123",
      external_reference: "user-1",
      preapproval_plan_id: "plan-pro",
      status: "authorized",
    });
  });

  it("processa subscription_preapproval_cancelled", async () => {
    const body = {
      type: "subscription_preapproval_cancelled",
      data: { id: "sub-456" },
    };
    const req = webhookRequest(body, { topic: "subscription" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(processSubscriptionCancelled).toHaveBeenCalledWith({ id: "sub-456" });
  });

  it("processa subscription_preapproval_suspended", async () => {
    const body = {
      type: "subscription_preapproval_suspended",
      data: { id: "sub-789" },
    };
    const req = webhookRequest(body, { topic: "subscription" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(processSubscriptionSuspended).toHaveBeenCalledWith({ id: "sub-789" });
  });

  it("processa payment approved", async () => {
    const body = {
      type: "payment",
      data: {
        id: "pay-1",
        subscription_id: "sub-123",
        transaction_amount: 3900,
        currency_id: "BRL",
        status: "approved",
        payment_method_id: "credit_card",
        installments: 1,
        card: { last_four_digits: "1234" },
        transaction_details: {},
        date_approved: "2026-01-01",
      },
    };
    const req = webhookRequest(body, { topic: "payment_event" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(processPaymentCreated).toHaveBeenCalled();
  });

  it("ignora payment não approved", async () => {
    const body = {
      type: "payment",
      data: { id: "pay-2", status: "pending" },
    };
    const req = webhookRequest(body, { topic: "payment_event" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(processPaymentCreated).not.toHaveBeenCalled();
  });

  it("retorna 500 quando processamento falha", async () => {
    vi.mocked(processSubscriptionAuthorized).mockRejectedValueOnce(new Error("DB error"));
    const body = {
      type: "subscription_preapproval_authorized",
      data: { id: "sub-err" },
    };
    const req = webhookRequest(body, { topic: "subscription" }, { sign: true });
    const res = await POST(req);
    expect(res.status).toBe(500);
  });

  it("rejeita webhook sem secret configurado (bug corrigido)", async () => {
    // Re-importa sem o secret
    vi.stubEnv("MERCADO_PAGO_WEBHOOK_SECRET", "");
    vi.resetModules();
    const mod = await import("@/app/api/webhooks/mercadopago/route");

    const body = {
      type: "subscription_preapproval_authorized",
      data: { id: "forged-sub", status: "authorized" },
    };
    const req = webhookRequest(body, { topic: "subscription" });
    const res = await mod.POST(req);
    // Agora retorna 401 em vez de aceitar
    expect(res.status).toBe(401);
  });
});
