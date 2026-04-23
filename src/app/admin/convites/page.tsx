"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminConvitesPage() {
  const router = useRouter();
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState("");

  useEffect(() => { loadInvites(); }, []);
  async function loadInvites() { const r = await fetch("/api/admin/convites"); if (r.ok) setInvites(await r.json()); }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault(); setSending(true); setFeedback("");
    const r = await fetch("/api/admin/convites", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, plan, message: message || undefined }) });
    const d = await r.json(); setSending(false);
    if (r.ok) { setFeedback(`Convite enviado para ${email}`); setEmail(""); setMessage(""); loadInvites(); }
    else setFeedback(d.error);
  }

  async function action(id: string, act: string) {
    await fetch(`/api/admin/convites/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: act }) });
    loadInvites();
  }

  const statusColors: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", ACCEPTED: "bg-green-100 text-green-700", EXPIRED: "bg-stone-100 text-stone-500", CANCELLED: "bg-red-100 text-red-500" };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Convites</h1>

      <form onSubmit={createInvite} className="bg-white rounded-xl border border-stone-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Novo convite</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} required type="email" className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30" placeholder="pessoa@email.com" />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Plano</label>
            <select value={plan} onChange={e => setPlan(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none">
              <option value="FREE">Free</option><option value="PRO">Pro (R$ 39/mês)</option><option value="TEAM">Team (R$ 99/mês)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Mensagem (opcional)</label>
            <input value={message} onChange={e => setMessage(e.target.value)} maxLength={500} className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none" placeholder="Mensagem para o convidado" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button type="submit" disabled={sending} className="px-5 py-2 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">{sending ? "Enviando..." : "Enviar convite"}</button>
          {feedback && <span className={`text-sm ${feedback.startsWith("Convite") ? "text-green-600" : "text-red-500"}`}>{feedback}</span>}
        </div>
      </form>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Plano</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invites.map(inv => (
              <tr key={inv.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                <td className="px-4 py-3 text-stone-700">{inv.email}</td>
                <td className="px-4 py-3 text-stone-600">{inv.plan}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[inv.status] || ""}`}>{inv.status}</span></td>
                <td className="px-4 py-3 text-stone-400">{new Date(inv.createdAt).toLocaleDateString("pt-BR")}</td>
                <td className="px-4 py-3">
                  {inv.status === "PENDING" && (
                    <button onClick={() => action(inv.id, "cancel")} className="text-xs text-red-500 hover:text-red-700 mr-3">Cancelar</button>
                  )}
                  {(inv.status === "EXPIRED" || inv.status === "CANCELLED") && (
                    <button onClick={() => action(inv.id, "resend")} className="text-xs text-trama-500 hover:text-trama-700">Reenviar</button>
                  )}
                </td>
              </tr>
            ))}
            {invites.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-stone-400">Nenhum convite enviado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
