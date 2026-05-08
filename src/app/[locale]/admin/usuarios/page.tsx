"use client";
import { useState, useEffect } from "react";

export default function AdminUsuariosPage() {
  const [data, setData] = useState<any>({ users: [], stats: { total: 0, byPlan: {}, active: 0 } });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const r = await fetch("/api/admin/usuarios");
    if (r.ok) setData(await r.json());
  }

  async function updateUser(id: string, body: any) {
    await fetch(`/api/admin/usuarios/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    load();
  }

  async function deleteUser(id: string) {
    setDeleting(true);
    const r = await fetch(`/api/admin/usuarios/${id}`, { method: "DELETE" });
    setDeleting(false);
    setConfirmDelete(null);
    if (!r.ok) {
      const err = await r.json();
      alert(err.error || "Erro ao apagar usuário.");
      return;
    }
    load();
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Usuários</h1>

      {/* Stats */}
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

      {/* Tabela */}
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
                  <select
                    value={u.plan}
                    onChange={e => updateUser(u.id, { plan: e.target.value })}
                    className="text-xs px-2 py-1 rounded-lg border border-stone-200 bg-white focus:outline-none"
                  >
                    <option value="FREE">Free</option>
                    <option value="PRO">Pro</option>
                    <option value="TEAM">Team</option>
                  </select>
                </td>
                <td className="px-4 py-3 text-stone-500">{u._count.ownedProjects}</td>
                <td className="px-4 py-3 text-stone-500">{u._count.codings}</td>
                <td className="px-4 py-3 text-stone-400 text-xs">
                  {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString("pt-BR") : "Nunca"}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-500"}`}>
                    {u.isActive ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => updateUser(u.id, { isActive: !u.isActive })}
                      className={`text-xs font-medium ${u.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}`}
                    >
                      {u.isActive ? "Desativar" : "Ativar"}
                    </button>
                    <span className="text-stone-200">|</span>
                    <button
                      onClick={() => setConfirmDelete(u.id)}
                      className="text-xs font-medium text-stone-400 hover:text-red-600 transition-colors"
                    >
                      Apagar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de confirmação */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-xl p-8 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold text-stone-800 mb-2">Apagar usuário?</h2>
            <p className="text-sm text-stone-500 mb-6">
              Esta ação é permanente. Todos os projetos, documentos, códigos e temas deste usuário serão apagados.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteUser(confirmDelete)}
                disabled={deleting}
                className="px-4 py-2 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {deleting ? "Apagando..." : "Apagar permanentemente"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
