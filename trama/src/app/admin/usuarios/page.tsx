"use client";
import { useState, useEffect } from "react";

export default function AdminUsuariosPage() {
  const [data, setData] = useState<any>({ users: [], stats: { total: 0, byPlan: {}, active: 0 } });
  useEffect(() => { load(); }, []);
  async function load() { const r = await fetch("/api/admin/usuarios"); if (r.ok) setData(await r.json()); }

  async function updateUser(id: string, body: any) {
    await fetch(`/api/admin/usuarios/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    load();
  }

  const planColors: Record<string, string> = { FREE: "bg-stone-100 text-stone-600", PRO: "bg-trama-50 text-trama-600", TEAM: "bg-orange-50 text-orange-600" };

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Usuários</h1>
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-stone-200 p-5">
          <p className="text-xs text-stone-400 mb-1">Total</p>
          <p className="text-2xl font-semibold text-stone-800">{data.stats.total}</p>
        </div>
        {["FREE", "PRO", "TEAM"].map(p => (
          <div key={p} className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 mb-1">{p}</p>
            <p className="text-2xl font-semibold text-stone-800">{data.stats.byPlan?.[p] || 0}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-stone-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-100 bg-stone-50">
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Nome</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Email</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Plano</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Projetos</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Codificações</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Último acesso</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Status</th>
              <th className="text-left px-4 py-3 text-xs font-medium text-stone-500">Ações</th>
            </tr>
          </thead>
          <tbody>
            {data.users.map((u: any) => (
              <tr key={u.id} className="border-b border-stone-50 hover:bg-stone-50/50">
                <td className="px-4 py-3 text-stone-700 font-medium">{u.name || "—"}</td>
                <td className="px-4 py-3 text-stone-500">{u.email}</td>
                <td className="px-4 py-3">
                  <select value={u.plan} onChange={e => updateUser(u.id, { plan: e.target.value })}
                    className="text-xs px-2 py-1 rounded-lg border border-stone-200 bg-white focus:outline-none">
                    <option value="FREE">Free</option><option value="PRO">Pro</option><option value="TEAM">Team</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-stone-500">{u._count.ownedProjects}</td>
                <td className="px-4 py-3 text-stone-500">{u._count.codings}</td>
                <td className="px-4 py-3 text-stone-400 text-xs">{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("pt-BR") : "Nunca"}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                    {u.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                    className={`text-xs font-medium ${u.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}>
                    {u.isActive ? "Desativar" : "Ativar"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
