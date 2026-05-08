"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";

interface Payment {
  id: string;
  amount: number;
  status: string;
  date: string;
  method: string | null;
  cardLast4: string | null;
  receiptUrl: string | null;
}

interface Subscription {
  plan: string;
  status: string;
  currentPeriodEnd: string;
  currentPeriodStart: string;
  cancelAtPeriodEnd: boolean;
  lastPayment: {
    amount: number;
    status: string;
    date: string;
    method: string | null;
    cardLast4: string | null;
  } | null;
  payments: Payment[];
}

const STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Ativa",
  PAST_DUE: "Pendente",
  CANCELLED: "Cancelada",
  EXPIRED: "Expirada",
  PENDING: "Pendente",
};

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAST_DUE: "bg-yellow-100 text-yellow-700",
  CANCELLED: "bg-stone-100 text-stone-600",
  EXPIRED: "bg-red-100 text-red-700",
  PENDING: "bg-blue-100 text-blue-700",
};

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  approved: "Aprovado",
  pending: "Pendente",
  rejected: "Rejeitado",
  cancelled: "Cancelado",
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function formatCurrency(cents: number) {
  return `R$ ${(cents / 100).toFixed(2).replace(".", ",")}`;
}

export default function ManageBillingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login?callbackUrl=/billing/manage");
      return;
    }

    if (status === "authenticated") {
      fetchSubscription();
    }
  }, [status]);

  async function fetchSubscription() {
    try {
      const res = await fetch("/api/billing/subscription");
      const data = await res.json();
      setSubscription(data.subscription);
    } catch {
      console.error("Erro ao carregar assinatura");
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!confirm("Tem certeza que deseja cancelar? O acesso continua até o fim do período.")) {
      return;
    }

    setCancelling(true);
    try {
      const res = await fetch("/api/billing/cancel", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao cancelar");
        return;
      }

      alert(`Assinatura cancelada. Acesso mantido até ${formatDate(data.accessUntil)}`);
      fetchSubscription();
    } catch {
      alert("Erro ao cancelar assinatura");
    } finally {
      setCancelling(false);
    }
  }

  if (status === "loading" || loading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) return null;

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-lg font-bold text-stone-800">
            TRAMA
          </Link>
          <Link href="/dashboard" className="text-sm text-stone-600 hover:text-stone-800">
            Voltar ao dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold text-stone-900 mb-8">
          Gerenciar Assinatura
        </h1>

        {!subscription ? (
          <div className="bg-white rounded-xl border p-8 text-center">
            <p className="text-stone-600 mb-4">
              Você não possui uma assinatura ativa.
            </p>
            <Link
              href="/billing/upgrade"
              className="inline-block py-2.5 px-6 bg-trama-500 text-white rounded-lg font-medium hover:bg-trama-600 transition"
            >
              Ver planos
            </Link>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl border p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-sm text-stone-500">Plano atual</p>
                  <p className="text-xl font-bold text-stone-900">
                    {subscription.plan === "PRO" ? "Pro" : subscription.plan === "TEAM" ? "Team" : "Free"}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    STATUS_COLORS[subscription.status] || "bg-stone-100 text-stone-600"
                  }`}
                >
                  {STATUS_LABELS[subscription.status] || subscription.status}
                </span>
              </div>

              {subscription.lastPayment && (
                <div className="border-t pt-4 mt-4">
                  <p className="text-sm text-stone-500 mb-2">Último pagamento</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-stone-900 font-medium">
                      {formatCurrency(subscription.lastPayment.amount)}
                    </span>
                    <span className="text-stone-500">
                      {formatDate(subscription.lastPayment.date)}
                      {subscription.lastPayment.cardLast4 && ` · •••• ${subscription.lastPayment.cardLast4}`}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t pt-4 mt-4">
                <p className="text-sm text-stone-500">
                  {subscription.cancelAtPeriodEnd
                    ? "Acesso até"
                    : "Próxima cobrança"}
                  <span className="text-stone-900 font-medium ml-2">
                    {formatDate(subscription.currentPeriodEnd)}
                  </span>
                </p>
              </div>

              {!subscription.cancelAtPeriodEnd && subscription.status === "ACTIVE" && (
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="mt-4 w-full py-2.5 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 disabled:opacity-50 transition"
                >
                  {cancelling ? "Cancelando..." : "Cancelar assinatura"}
                </button>
              )}

              {subscription.cancelAtPeriodEnd && (
                <p className="mt-4 text-sm text-stone-500 text-center">
                  Assinatura cancelada. Acesso mantido até {formatDate(subscription.currentPeriodEnd)}.
                </p>
              )}
            </div>

            {subscription.payments.length > 0 && (
              <div className="bg-white rounded-xl border p-6">
                <h2 className="text-lg font-bold text-stone-900 mb-4">
                  Histórico de pagamentos
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-stone-500">
                        <th className="text-left py-2 font-medium">Data</th>
                        <th className="text-left py-2 font-medium">Valor</th>
                        <th className="text-left py-2 font-medium">Método</th>
                        <th className="text-left py-2 font-medium">Status</th>
                        <th className="text-right py-2 font-medium">Recibo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subscription.payments.map((p) => (
                        <tr key={p.id} className="border-b last:border-b-0">
                          <td className="py-3 text-stone-900">{formatDate(p.date)}</td>
                          <td className="py-3 text-stone-900 font-medium">
                            {formatCurrency(p.amount)}
                          </td>
                          <td className="py-3 text-stone-500">
                            {p.cardLast4 ? `•••• ${p.cardLast4}` : p.method || "—"}
                          </td>
                          <td className="py-3">
                            <span className={`text-xs font-medium ${
                              p.status === "approved" ? "text-green-600" :
                              p.status === "pending" ? "text-yellow-600" :
                              "text-red-600"
                            }`}>
                              {PAYMENT_STATUS_LABELS[p.status] || p.status}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            {p.receiptUrl ? (
                              <a
                                href={p.receiptUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-trama-500 hover:text-trama-600"
                              >
                                Ver
                              </a>
                            ) : (
                              <span className="text-stone-300">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
