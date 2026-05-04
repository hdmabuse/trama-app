"use client";

import React, { useState } from "react";
import { Ic, ic, COLORS } from "./icons";

interface CodingPopupProps {
  codes: { id: string; name: string; color: string; children?: any[] }[];
  selectedText: string;
  onApply: (codeId: string, memo: string) => Promise<void>;
  onCreateCode: (name: string, color: string) => Promise<string | null>;
  onClose: () => void;
}

export function CodingPopup({ codes, selectedText, onApply, onCreateCode, onClose }: CodingPopupProps) {
  const [sel, setSel] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newN, setNewN] = useState("");
  const [newC, setNewC] = useState("#6366f1");
  const [saving, setSaving] = useState(false);
  const [applying, setApplying] = useState(false);

  const all = codes.flatMap((c) => [c, ...(c.children || [])]);
  const filtered = all.filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()));

  async function handleCreate() {
    setSaving(true);
    const id = await onCreateCode(creating ? newN : search.trim(), newC);
    setSaving(false);
    if (id) {
      setSel(id);
      setCreating(false);
      setSearch("");
    }
  }

  async function handleApply() {
    if (!sel) return;
    setApplying(true);
    try {
      await onApply(sel, memo);
    } catch (err) {
      console.error("Erro ao aplicar codificação:", err);
      setApplying(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-stone-800">Codificar trecho</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <Ic d={ic.x} className="w-4 h-4" />
          </button>
        </div>

        {/* Selected text */}
        <div className="bg-stone-50 rounded-lg p-3 mb-4 border-l-[3px] border-argila">
          <p className="text-xs text-stone-500 italic leading-relaxed line-clamp-3">&ldquo;{selectedText}&rdquo;</p>
          <span className="text-[11px] text-stone-400 mt-1.5 block">{selectedText.length} caracteres</span>
        </div>

        {/* Search */}
        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 gap-1.5 mb-3">
          <Ic d={ic.search} className="w-3 h-3 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar ou criar código..."
            className="bg-transparent text-xs flex-1 outline-none"
            autoFocus
          />
        </div>

        {!creating ? (
          <div className="max-h-48 overflow-y-auto mb-3 scrollbar-thin">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setSel(c.id)}
                className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-0.5 transition text-left ${
                  sel === c.id ? "bg-stone-100" : "hover:bg-stone-50"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                    sel === c.id ? "border-transparent" : "border-stone-300"
                  }`}
                  style={sel === c.id ? { background: c.color } : {}}
                >
                  {sel === c.id && <Ic d={ic.check} className="w-2.5 h-2.5 text-white" />}
                </span>
                <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                <span className="text-sm text-stone-700">{c.name}</span>
              </button>
            ))}

            {search.trim() && (
              <button
                onClick={() => {
                  setCreating(true);
                  setNewN(search.trim());
                }}
                className="w-full flex items-center gap-2.5 px-2.5 py-2.5 rounded-md text-left hover:bg-trama-50 border border-dashed border-stone-200 mt-2 transition"
              >
                <span className="w-4 h-4 rounded bg-trama-500 flex items-center justify-center shrink-0">
                  <Ic d={ic.plus} className="w-2.5 h-2.5 text-white" />
                </span>
                <span className="text-sm text-trama-600 font-medium">Criar &ldquo;{search.trim()}&rdquo;</span>
              </button>
            )}
          </div>
        ) : (
          <div className="bg-stone-50 rounded-lg p-3 mb-3 border border-stone-200">
            <p className="text-[11px] font-semibold text-stone-500 uppercase tracking-wider mb-2">Novo código</p>
            <input
              value={newN}
              onChange={(e) => setNewN(e.target.value)}
              autoFocus
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 bg-white"
              placeholder="Nome"
            />
            <div className="flex gap-2 mb-3">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setNewC(c)}
                  className={`w-5 h-5 rounded-full transition ${
                    newC === c ? "ring-2 ring-offset-1 ring-stone-400" : ""
                  }`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setCreating(false)} className="px-3 py-1 text-xs text-stone-500">
                Voltar
              </button>
              <button
                onClick={handleCreate}
                disabled={!newN.trim() || saving}
                className="px-3 py-1 bg-trama-500 text-white text-xs font-medium rounded-md disabled:opacity-50"
              >
                {saving ? "Criando..." : "Criar e selecionar"}
              </button>
            </div>
          </div>
        )}

        {/* Memo */}
        <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1.5">
          Memo (opcional)
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          placeholder="Nota sobre este trecho..."
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-trama-500/30"
        />

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500">
            Cancelar
          </button>
          <button
            onClick={handleApply}
            disabled={!sel || applying}
            className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
          >
            {applying ? "Aplicando..." : "Aplicar"}
          </button>
        </div>
      </div>
    </div>
  );
}
