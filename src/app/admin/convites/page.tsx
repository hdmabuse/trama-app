"use client";
import { useState, useEffect } from "react";

export default function AdminConvitesPage() {
  const [invites, setInvites] = useState<any[]>([]);
  const [email, setEmail] = useState("");
  const [plan, setPlan] = useState("FREE");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ text: string; type: "success" | "error" | "warning" } | null>(null);
  const [resending, setResending] = useState<string | null>(null);

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    const r = await fetch("/api/admin/convites");
    if (r.ok) setInvites(await r.json());
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setFeedback(null);

    try {
      const r = await fetch("/api/admin/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, message: message || undefined }),
      });
      const d = await r.json();
      setSending(false);

      if (r.ok) {
        if (d.emailSent) {
          setFeedback({ text: `Convite criado e email enviado para ${email}`, type: "success" });
        } else {
          setFeedback({
            text: `Convite criado, mas o email não foi enviado: ${d.emailError || "serviço não configurado"}. Copie o link manualmente.`,
            type: "warning",
          });
        }
        setEmail("");
        setMessage("");
        loadInvites();
      } else {
        setFeedback({ text: d.error, type: "error" });
      }
    } catch (err) {
      setSending(false);
      setFeedback({ text: "Erro de conexão ao criar convite", type: "error" });
    }
  }

  async function action(id: string, act: string) {
    setResending(act === "resend" || act === "send_email" ? id : null);

    try {
      const r = await fetch(`/api/admin/convites/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: act }),
      });
      const d = await r.json();

      if ((act === "resend" || act === "send_email") && r.ok) {
        if (d.emailSent) {
          setFeedback({ text: `Email reenviado para ${d.email}`, type: "success" });
        } else {
          setFeedback({
            text: `Email não enviado: ${d.emailError || "serviço não configurado"}`,
            type: "warning",
          });
        }
      }
    } catch (err) {
      setFeedback({ text: "Erro ao executar ação", type: "error" });
    }

    setResending(null);
    loadInvites();
  }

  function copyInviteLink(token: string) {
    const url = `${window.location.origin}/convite/${token}`;
    navigator.clipboard.writeText(url).then(() => {
      setFeedback({ text: "Link copiado para a área de transferência", type: "success" });
      setTimeout(() => setFeedback(null), 3000);
    });
  }

  const statusColors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700",
    ACCEPTED: "bg-green-100 text-green-700",
    EXPIRED: "bg-stone-100 text-stone-500",
    CANCELLED: "bg-red-100 text-red-500",
  };

  const feedbackColors = {
    success: "text-green-600 bg-green-50 border-green-200",
    error: "text-red-600 bg-red-50 border-red-200",
    warning: "text-amber-600 bg-amber-50 border-amber-200",
  };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Convites</h1>

      {/* Feedback global */}
      {feedback && (
        <div className={`mb-4 px-4 py-3 rounded-lg border text-sm ${feedbackColors[feedback.type]}`}>
          {feedback.text}
          <button onClick={() => setFeedback(null)} className="float-right font-bold opacity-50 hover:opacity-100">
            ✕
          </button>
        </div>
      )}

      {/* Formulário de novo convite */}
      <form onSubmit={createInvite} className="bg-white rounded-xl border border-stone-200 p-6 mb-8">
        <h2 className="text-sm font-semibold text-stone-700 mb-4">Novo convite</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-xs text-stone-500 mb-1">Email</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-trama-500/30"
              placeholder="pessoa@email.com"
            />
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Plano</label>
            <select
              value={plan}
              onChange={(e) => setPlan(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none"
            >
              <option value="FREE">Free</option>
              <option value="PRO">Pro (R$ 39/mês)</option>
              <option value="TEAM">Team (R$ 99/mês)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-stone-500 mb-1">Mensagem (opcional)</label>
            <input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              maxLength={500}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none"
              placeholder="Mensagem para o convidado"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={sending}
          className="px-5 py-2 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg disabled:opacity-50"
        >
          {sending ? "Enviando..." : "Enviar convite"}
        </button>
      </form>

      {/* Tabela de convites */}
      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Plano</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Data</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Expira</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => {
              const isExpired = new Date(inv.expiresAt) < new Date() && inv.status === "PENDING";
              return (
                <tr key={inv.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                  <td className="px-4 py-3 text-stone-700">{inv.email}</td>
                  <td className="px-4 py-3 text-stone-600">{inv.plan}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        isExpired ? "bg-stone-100 text-stone-500" : statusColors[inv.status] || ""
                      }`}
                    >
                      {isExpired ? "EXPIRED" : inv.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-400">{new Date(inv.createdAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-stone-400">{new Date(inv.expiresAt).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {/* Copiar link */}
                      {inv.status === "PENDING" && !isExpired && (
                        <button
                          onClick={() => copyInviteLink(inv.token)}
                          className="text-xs text-stone-500 hover:text-stone-700 px-2 py-1 rounded border border-stone-200 hover:bg-stone-50"
                          title="Copiar link do convite"
                        >
                          Copiar link
                        </button>
                      )}

                      {/* Reenviar email */}
                      {inv.status === "PENDING" && !isExpired && (
                        <button
                          onClick={() => action(inv.id, "send_email")}
                          disabled={resending === inv.id}
                          className="text-xs text-trama-500 hover:text-trama-700 px-2 py-1 rounded border border-trama-200 hover:bg-trama-50 disabled:opacity-50"
                        >
                          {resending === inv.id ? "Enviando..." : "Reenviar email"}
                        </button>
                      )}

                      {/* Cancelar */}
                      {inv.status === "PENDING" && (
                        <button
                          onClick={() => action(inv.id, "cancel")}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Cancelar
                        </button>
                      )}

                      {/* Reenviar (expirado/cancelado) */}
                      {(inv.status === "EXPIRED" || inv.status === "CANCELLED" || isExpired) && (
                        <button
                          onClick={() => action(inv.id, "resend")}
                          disabled={resending === inv.id}
                          className="text-xs text-trama-500 hover:text-trama-700 disabled:opacity-50"
                        >
                          {resending === inv.id ? "Reenviando..." : "Reenviar"}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {invites.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-stone-400">
                  Nenhum convite enviado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
