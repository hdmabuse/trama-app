"use client";

import React, { useState } from "react";
import { Ic, ic } from "./icons";
import type { Doc } from "./types";

interface MemoModalProps {
  documents: Doc[];
  defaultLinkedDocId?: string | null;
  onClose: () => void;
  onSave: (title: string, content: string, linkedDocumentId: string | null) => Promise<boolean>;
}

export function MemoModal({ documents, defaultLinkedDocId, onClose, onSave }: MemoModalProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [linkedDocId, setLinkedDocId] = useState<string | null>(defaultLinkedDocId || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filtrar: só fontes primárias podem ser vinculadas (não outros memos)
  const linkableDocs = documents.filter((d) => d.type !== "MEMO");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    setError(null);
    setSaving(true);
    try {
      const success = await onSave(title.trim(), content.trim(), linkedDocId);
      if (!success) {
        setError("Erro ao criar memorando. Tente novamente.");
        setSaving(false);
      }
      // Se success, o parent fecha o modal via setShowNewMemo(false)
    } catch (err) {
      setError("Erro inesperado ao criar memorando.");
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Ic d={ic.memo} className="w-4 h-4 text-amber-500" />
            <h3 className="text-base font-semibold text-stone-800">Novo Memorando</h3>
          </div>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <Ic d={ic.x} className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-400 mb-4">
          Memorandos são reflexões analíticas que podem ser codificados como qualquer documento.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 text-xs rounded-lg px-3 py-2 mb-3">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
            placeholder="Título do memorando"
          />

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={8}
            required
            className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500/30 font-mono leading-relaxed"
            placeholder="Escreva sua reflexão, hipótese ou observação analítica..."
          />

          {/* Vincular a documento */}
          <div className="mb-4">
            <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1.5">
              Vincular a documento (opcional)
            </label>
            <select
              value={linkedDocId || ""}
              onChange={(e) => setLinkedDocId(e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 bg-white"
            >
              <option value="">Nenhum</option>
              {linkableDocs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.title}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-[11px] text-stone-400">
              {content.split(/\s+/).filter(Boolean).length} palavras
            </span>
            <div className="flex gap-2">
              <button type="button" onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500" disabled={saving}>
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !content.trim() || saving}
                className="px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition flex items-center gap-1.5"
              >
                <Ic d={ic.memo} className="w-3 h-3" />
                {saving ? "Salvando..." : "Criar memorando"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
