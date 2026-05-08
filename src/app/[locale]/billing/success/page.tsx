"use client";

import Link from "next/link";

export default function BillingSuccessPage() {
  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center">
      <div className="max-w-md mx-auto px-4 text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-stone-900 mb-3">
          Assinatura ativada!
        </h1>
        <p className="text-stone-600 mb-8">
          Seu pagamento foi confirmado e seus novos recursos já estão disponíveis.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="py-3 px-6 bg-trama-500 text-white rounded-lg font-medium hover:bg-trama-600 transition"
          >
            Ir para o dashboard
          </Link>
          <Link
            href="/billing/manage"
            className="py-3 px-6 border border-stone-200 text-stone-700 rounded-lg font-medium hover:bg-stone-50 transition"
          >
            Gerenciar assinatura
          </Link>
        </div>
      </div>
    </div>
  );
}
