"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useState } from "react";

type Project = { id: string; name: string; description: string | null; color: string; owner: { name: string | null }; _count: { documents: number; codes: number } };

const PLAN_PROJECT_LIMITS: Record<string, number> = { FREE: 3, PRO: 20, TEAM: Infinity };

export function DashboardClient({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const { data: session } = useSession();
  const plan = (session?.user as any)?.plan || "FREE";
  const limit = PLAN_PROJECT_LIMITS[plan] || 3;
  const usage = projects.length;
  const pct = limit === Infinity ? 0 : Math.round((usage / limit) * 100);
  const barColor = pct >= 100 ? "bg-red-400" : pct >= 80 ? "bg-yellow-400" : "bg-trama-500";

  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [color, setColor] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const colors = ["#6366f1","#10b981","#ef4444","#f59e0b","#ec4899","#8b5cf6","#C97B5D"];

  async function createProject(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError("");
    const res = await fetch("/api/projetos", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: desc, color }) });
    const data = await res.json(); setSaving(false);
    if (!res.ok) {
      if (data.error === "PLAN_LIMIT") setError(`Limite do plano ${data.plan}: ${data.limit} projetos. Faça upgrade para criar mais.`);
      else setError(data.error); return;
    }
    setShowNew(false); setName(""); setDesc(""); router.refresh();
  }

  return (
    <main className="flex-1 p-8 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-800">Meus projetos</h1>
          <p className="text-sm text-stone-400 mt-1">{projects.length} projeto{projects.length !== 1 && "s"}</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="px-4 py-2 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg transition flex items-center gap-1.5">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
          Novo projeto
        </button>
      </div>

      {/* Usage bar */}
      {limit !== Infinity && (
        <div className="mb-6 bg-white rounded-lg border border-stone-200 px-4 py-3 flex items-center gap-4">
          <span className="text-xs text-stone-500">Projetos: {usage}/{limit}</span>
          <div className="flex-1 bg-stone-100 rounded-full h-2 overflow-hidden">
            <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${Math.min(pct, 100)}%` }} />
          </div>
          {pct >= 80 && <Link href="/cadastro" className="text-xs text-trama-500 font-medium shrink-0">Upgrade</Link>}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {projects.map((p) => (
          <Link key={p.id} href={`/projeto/${p.id}`}
            className="bg-white rounded-xl border border-stone-200 p-6 hover:shadow-md hover:border-stone-300 transition group">
            <div className="flex items-center gap-2.5 mb-3">
              <span className="w-3 h-3 rounded" style={{ background: p.color }} />
              <span className="font-semibold text-stone-800 group-hover:text-trama-500 transition">{p.name}</span>
            </div>
            {p.description && <p className="text-sm text-stone-400 mb-5 line-clamp-2">{p.description}</p>}
            <div className="flex gap-4 text-xs text-stone-400">
              <span><strong className="text-stone-600">{p._count.documents}</strong> docs</span>
              <span><strong className="text-stone-600">{p._count.codes}</strong> códigos</span>
            </div>
            <div className="flex justify-between items-center mt-4 pt-3 border-t border-stone-100">
              <span className="text-xs text-stone-400">{p.owner.name}</span>
            </div>
          </Link>
        ))}
        <button onClick={() => setShowNew(true)}
          className="rounded-xl border-2 border-dashed border-stone-200 hover:border-trama-500 p-6 flex flex-col items-center justify-center min-h-[200px] transition group">
          <div className="w-12 h-12 rounded-xl bg-stone-50 group-hover:bg-trama-50 flex items-center justify-center mb-3 transition">
            <svg className="w-5 h-5 text-stone-400 group-hover:text-trama-500 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" /></svg>
          </div>
          <span className="text-sm text-stone-400">Novo projeto</span>
        </button>
      </div>

      {showNew && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowNew(false)}>
          <form onClick={e => e.stopPropagation()} onSubmit={createProject} className="bg-white rounded-xl shadow-xl p-8 w-full max-w-md">
            <h2 className="text-lg font-semibold text-stone-800 mb-6">Novo projeto</h2>
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Nome</label>
            <input value={name} onChange={e => setName(e.target.value)} required
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Ex: Entrevistas NPS Q2" />
            <label className="block text-xs font-medium text-stone-500 mb-1.5">Descrição</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Breve descrição..." />
            <label className="block text-xs font-medium text-stone-500 mb-2">Cor</label>
            <div className="flex gap-2 mb-6">
              {colors.map(c => <button key={c} type="button" onClick={() => setColor(c)}
                className={`w-7 h-7 rounded-full transition ${color === c ? "ring-2 ring-offset-2 ring-stone-400" : ""}`} style={{ background: c }} />)}
            </div>
            {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-4">{error}</p>}
            <div className="flex justify-end gap-3">
              <button type="button" onClick={() => setShowNew(false)} className="px-4 py-2 text-sm text-stone-500">Cancelar</button>
              <button type="submit" disabled={saving || !name} className="px-5 py-2 bg-trama-500 hover:bg-trama-600 text-white text-sm font-medium rounded-lg disabled:opacity-50">
                {saving ? "Criando..." : "Criar projeto"}</button>
            </div>
          </form>
        </div>
      )}
    </main>
  );
}
