"use client";

import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Pro",
    plan: "PRO" as const,
    price: "R$ 39",
    period: "/mês",
    features: [
      "20 projetos",
      "100 documentos por projeto",
      "5 membros por projeto",
      "5 GB de storage",
      "Export PDF, Markdown, JSON, CSV",
    ],
  },
  {
    name: "Team",
    plan: "TEAM" as const,
    price: "R$ 99",
    period: "/mês",
    features: [
      "Projetos ilimitados",
      "500 documentos por projeto",
      "20 membros por projeto",
      "20 GB de storage",
      "Export PDF, Markdown, JSON, CSV",
      "Administração de equipe",
    ],
  },
];

export default function UpgradePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedPlan = searchParams.get("plan") as "PRO" | "TEAM" | null;
  const [selectedPlan, setSelectedPlan] = useState<"PRO" | "TEAM">(
    preselectedPlan || "PRO"
  );
  const [loading, setLoading] = useState(false);

  if (status === "loading") {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  if (!session) {
    router.push("/login?callbackUrl=/billing/upgrade");
    return null;
  }

  async function handleSubscribe() {
    setLoading(true);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan: selectedPlan }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Erro ao criar checkout");
        return;
      }

      window.location.href = data.checkoutUrl;
    } catch {
      alert("Erro ao processar solicitação");
    } finally {
      setLoading(false);
    }
  }

  const selected = PLANS.find((p) => p.plan === selectedPlan)!;

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
          Escolha seu plano
        </h1>

        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {PLANS.map((p) => (
            <button
              key={p.plan}
              onClick={() => setSelectedPlan(p.plan)}
              className={`text-left rounded-xl border-2 p-6 transition ${
                selectedPlan === p.plan
                  ? "border-trama-500 bg-white shadow-md"
                  : "border-stone-200 bg-white hover:border-stone-300"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-bold text-stone-900">{p.name}</h2>
                {selectedPlan === p.plan && (
                  <span className="w-5 h-5 rounded-full bg-trama-500 flex items-center justify-center">
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </span>
                )}
              </div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-stone-900">{p.price}</span>
                <span className="text-stone-500">{p.period}</span>
              </div>
              <ul className="space-y-2">
                {p.features.map((f) => (
                  <li key={f} className="text-sm text-stone-600 flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-trama-400" />
                    {f}
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-stone-500">Plano selecionado</p>
              <p className="text-xl font-bold text-stone-900">{selected.name}</p>
            </div>
            <p className="text-xl font-bold text-stone-900">
              {selected.price}
              <span className="text-sm text-stone-500 font-normal">{selected.period}</span>
            </p>
          </div>
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-3 bg-trama-500 text-white rounded-lg font-medium hover:bg-trama-600 disabled:opacity-50 transition"
          >
            {loading ? "Redirecionando..." : "Continuar com Mercado Pago"}
          </button>
          <p className="text-xs text-stone-500 text-center mt-3">
            Pagamento seguro via Mercado Pago. Cancele a qualquer momento.
          </p>
        </div>
      </main>
    </div>
  );
}
