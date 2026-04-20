"use client";

import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("pesquisador@trama.app.br");
  const [password, setPassword] = useState("trama2026");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("Email ou senha inválidos.");
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-10">
        {/* Logo */}
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black text-trama-500 tracking-tight mb-1">
            trama
          </h1>
          <p className="text-sm text-stone-400">
            Pesquisa qualitativa que se compõe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500 transition"
              placeholder="seu@email.com"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500 transition"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-trama-500 hover:bg-trama-600 text-white font-medium text-sm rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p className="text-center text-xs text-stone-400 mt-8">trama.app.br</p>
      </div>
    </div>
  );
}
