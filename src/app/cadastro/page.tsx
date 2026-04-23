"use client";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function CadastroPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const strength = password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /[0-9]/.test(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    if (password !== confirm) { setError("Senhas não coincidem."); setLoading(false); return; }
    if (!strength) { setError("Senha precisa de maiúscula, minúscula e número."); setLoading(false); return; }

    const res = await fetch("/api/auth/register", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();
    if (!res.ok) { setError(data.error); setLoading(false); return; }

    const login = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (login?.ok) router.push("/dashboard"); else setError("Conta criada, mas falha no login. Tente fazer login manualmente.");
  }

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-10">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black text-trama-500 tracking-tight mb-1">trama</h1>
          <p className="text-sm text-stone-400">Criar conta gratuita</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="Seu nome" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="seu@email.com" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="Mín. 8 caracteres" />
            {password && <div className={`h-1 rounded mt-1.5 ${strength ? "bg-green-400 w-full" : password.length >= 6 ? "bg-yellow-400 w-2/3" : "bg-red-400 w-1/3"}`} />}
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Confirmar senha</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500" placeholder="Repita a senha" />
          </div>
          {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-trama-500 hover:bg-trama-600 text-white font-medium text-sm rounded-lg transition disabled:opacity-50">
            {loading ? "Criando..." : "Criar conta grátis"}
          </button>
        </form>
        <p className="text-center text-xs text-stone-400 mt-6">
          Já tem conta? <a href="/login" className="text-trama-500 font-medium">Entrar</a>
        </p>
        <p className="text-center text-xs text-stone-400 mt-2">Plano Free: 3 projetos, 20 docs/projeto</p>
      </div>
    </div>
  );
}
