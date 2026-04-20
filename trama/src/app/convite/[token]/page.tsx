"use client";
import { signIn } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";

export default function ConvitePage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/convite/${token}`).then(async r => {
      if (r.ok) { setInvite(await r.json()); } else { const d = await r.json(); setError(d.error); }
      setLoading(false);
    });
  }, [token]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true);
    const res = await fetch(`/api/convite/${token}`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password }),
    });
    if (!res.ok) { const d = await res.json(); setError(d.error); setSaving(false); return; }
    const data = await res.json();
    await signIn("credentials", { email: data.email, password, redirect: false });
    router.push("/dashboard");
  }

  if (loading) return <div className="min-h-screen bg-stone-50 flex items-center justify-center"><p className="text-stone-400">Verificando convite...</p></div>;
  if (error) return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-sm border border-stone-200 p-10 max-w-sm text-center">
        <h1 className="text-4xl font-black text-trama-500 mb-4">trama</h1>
        <p className="text-sm text-red-500 bg-red-50 rounded-lg px-4 py-3 mb-4">{error}</p>
        <a href="/login" className="text-sm text-trama-500 font-medium">Ir para login</a>
      </div>
    </div>
  );

  const planLabels: Record<string, string> = { FREE: "Free", PRO: "Pro (R$ 39/mês)", TEAM: "Team (R$ 99/mês)" };

  return (
    <div className="min-h-screen bg-stone-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-sm border border-stone-200 p-10">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-black text-trama-500 mb-2">trama</h1>
          <p className="text-sm text-stone-500">Você foi convidado por <strong>{invite.inviterName}</strong></p>
        </div>
        <div className="bg-trama-50 rounded-lg p-4 mb-6 text-center">
          <p className="text-xs text-stone-500 mb-1">Plano atribuído</p>
          <p className="text-lg font-semibold text-trama-600">{planLabels[invite.plan]}</p>
        </div>
        {invite.message && <p className="text-sm text-stone-500 bg-stone-50 rounded-lg p-3 mb-6 italic">&ldquo;{invite.message}&rdquo;</p>}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Email</label>
            <input value={invite.email} disabled className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm bg-stone-50 text-stone-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Seu nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required autoFocus className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30" placeholder="Nome completo" />
          </div>
          <div>
            <label className="block text-xs font-medium text-stone-500 mb-1">Criar senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} className="w-full px-3 py-2.5 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30" placeholder="Mín. 8 caracteres" />
          </div>
          <button type="submit" disabled={saving} className="w-full py-2.5 bg-trama-500 hover:bg-trama-600 text-white font-medium text-sm rounded-lg transition disabled:opacity-50">
            {saving ? "Criando conta..." : "Aceitar convite e criar conta"}
          </button>
        </form>
      </div>
    </div>
  );
}
