"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

const PLANS = [
  {
    name: "Free",
    price: "R$ 0",
    period: "",
    plan: "FREE" as const,
    features: [
      "3 projetos",
      "20 documentos por projeto",
      "1 membro por projeto",
      "500 MB de storage",
      "Export Markdown",
    ],
    cta: "Começar grátis",
    highlighted: false,
  },
  {
    name: "Pro",
    price: "R$ 39",
    period: "/mês",
    plan: "PRO" as const,
    features: [
      "20 projetos",
      "100 documentos por projeto",
      "5 membros por projeto",
      "5 GB de storage",
      "Export PDF, Markdown, JSON, CSV",
      "Prioridade no suporte",
    ],
    cta: "Assinar Pro",
    highlighted: true,
  },
  {
    name: "Team",
    price: "R$ 99",
    period: "/mês",
    plan: "TEAM" as const,
    features: [
      "Projetos ilimitados",
      "500 documentos por projeto",
      "20 membros por projeto",
      "20 GB de storage",
      "Export PDF, Markdown, JSON, CSV",
      "Prioridade no suporte",
      "Administração de equipe",
    ],
    cta: "Assinar Team",
    highlighted: false,
  },
];

export default function PricingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSubscribe(plan: string) {
    if (status === "loading") return;

    if (!session) {
      router.push(`/login?callbackUrl=/pricing`);
      return;
    }

    setLoading(plan);

    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
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
      setLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="border-b bg-white">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-lg font-bold text-stone-800">
            TRAMA
          </Link>
          <nav className="flex gap-4 text-sm">
            {session ? (
              <>
                <Link href="/dashboard" className="text-stone-600 hover:text-stone-800">
                  Dashboard
                </Link>
                <span className="text-stone-300">|</span>
                <span className="text-stone-800 font-medium">Planos</span>
              </>
            ) : (
              <>
                <Link href="/login" className="text-stone-600 hover:text-stone-800">
                  Login
                </Link>
                <Link href="/cadastro" className="text-stone-600 hover:text-stone-800">
                  Cadastro
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-stone-900 mb-3">
            Escolha seu plano
          </h1>
          <p className="text-stone-600 max-w-2xl mx-auto">
            Comece grátis e faça upgrade quando precisar de mais recursos.
            Cancele a qualquer momento.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {PLANS.map((p) => (
            <div
              key={p.plan}
              className={`rounded-xl border-2 p-6 flex flex-col ${
                p.highlighted
                  ? "border-trama-500 shadow-lg bg-white"
                  : "border-stone-200 bg-white"
              }`}
            >
              {p.highlighted && (
                <span className="self-center -mt-1 mb-2 bg-trama-500 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Popular
                </span>
              )}

              <h2 className="text-xl font-bold text-stone-900">{p.name}</h2>
              <div className="mt-2 mb-6">
                <span className="text-3xl font-bold text-stone-900">
                  {p.price}
                </span>
                {p.period && (
                  <span className="text-stone-500">{p.period}</span>
                )}
              </div>

              <ul className="space-y-3 mb-8 flex-1">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-stone-700">
                    <svg className="w-4 h-4 text-green-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSubscribe(p.plan)}
                disabled={loading === p.plan}
                className={`w-full py-2.5 px-4 rounded-lg font-medium text-sm transition ${
                  p.highlighted
                    ? "bg-trama-500 text-white hover:bg-trama-600 disabled:opacity-50"
                    : "bg-stone-100 text-stone-800 hover:bg-stone-200 disabled:opacity-50"
                }`}
              >
                {loading === p.plan ? "Redirecionando..." : p.cta}
              </button>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center text-sm text-stone-500">
          <p>Pagamento seguro via Mercado Pago. Cartão de crédito.</p>
          <p className="mt-1">Cancele a qualquer momento sem taxas adicionais.</p>
        </div>
      </main>
    </div>
  );
}
