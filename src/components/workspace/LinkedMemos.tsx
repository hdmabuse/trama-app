"use client";

import React, { useState, useEffect } from "react";
import { Ic, ic } from "./icons";

interface LinkedMemo {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  updatedAt: string;
  _count: { codings: number };
}

interface LinkedMemosProps {
  projectId: string;
  documentId: string;
  onNavigate: (memoId: string) => void;
}

export function LinkedMemos({ projectId, documentId, onNavigate }: LinkedMemosProps) {
  const [memos, setMemos] = useState<LinkedMemo[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const r = await fetch(`/api/memorandos?projectId=${projectId}&linkedDocumentId=${documentId}`);
        if (r.ok) setMemos(await r.json());
      } catch (err) {
        console.error("Erro ao carregar memos vinculados:", err);
      }
      setLoading(false);
    }
    load();
  }, [projectId, documentId]);

  if (memos.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
      >
        <Ic d={ic.memo} className="w-3 h-3" />
        {memos.length} memo{memos.length !== 1 && "s"}
      </button>

      {open && (
        <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-64 z-40 max-h-72 overflow-y-auto">
          <div className="px-3 py-2 border-b border-stone-100">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
              Memorandos vinculados
            </span>
          </div>

          {loading && (
            <p className="text-xs text-stone-400 text-center py-4">Carregando...</p>
          )}

          {memos.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                onNavigate(m.id);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2.5 hover:bg-stone-50 border-b border-stone-50 transition"
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Ic d={ic.memo} className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-xs font-medium text-stone-700 truncate">{m.title}</span>
              </div>
              <p className="text-[11px] text-stone-400 line-clamp-2 pl-[18px] leading-relaxed">
                {m.content.slice(0, 100)}{m.content.length > 100 ? "..." : ""}
              </p>
              <div className="flex gap-3 pl-[18px] mt-1">
                <span className="text-[10px] text-stone-300">{m.wordCount} pal.</span>
                <span className="text-[10px] text-stone-300">{m._count.codings} cód.</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
