"use client";

import React, { useState, useEffect, useRef } from "react";
import { Ic, ic } from "./icons";
import type { Doc } from "./types";

interface SearchModalProps {
  projectId: string;
  documents: Doc[];
  onNavigate: (idx: number) => void;
  onClose: () => void;
}

export function SearchModal({ projectId, documents, onNavigate, onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { documentId: string; documentTitle: string; excerpt: string; offset: number }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const r = await fetch(`/api/busca?projectId=${projectId}&q=${encodeURIComponent(query)}`);
        if (r.ok) {
          const d = await r.json();
          setResults(d.results || []);
        }
      } catch (err) {
        console.error("Erro na busca:", err);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(t);
  }, [query, projectId]);

  function navigate(docId: string) {
    const idx = documents.findIndex((d) => d.id === docId);
    if (idx >= 0) onNavigate(idx);
  }

  function getDocType(docId: string): string | undefined {
    return documents.find((d) => d.id === docId)?.type;
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center pt-[15vh] z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-200">
          <Ic d={ic.search} className="w-4 h-4 text-stone-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar em todos os documentos..."
            className="flex-1 text-sm outline-none"
            autoFocus
          />
          <kbd className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded">ESC</kbd>
        </div>

        <div className="max-h-80 overflow-y-auto">
          {loading && <p className="text-xs text-stone-400 text-center py-6">Buscando...</p>}

          {!loading && query.length >= 2 && results.length === 0 && (
            <p className="text-xs text-stone-400 text-center py-6">
              Nenhum resultado para &ldquo;{query}&rdquo;
            </p>
          )}

          {results.map((r, i) => {
            const docType = getDocType(r.documentId);
            const isMemo = docType === "MEMO";
            return (
              <button
                key={i}
                onClick={() => navigate(r.documentId)}
                className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 transition"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Ic
                    d={isMemo ? ic.memo : ic.doc}
                    className={`w-3 h-3 shrink-0 ${isMemo ? "text-amber-400" : "text-trama-400"}`}
                  />
                  <span className={`text-xs font-medium ${isMemo ? "text-amber-500" : "text-trama-500"}`}>
                    {r.documentTitle}
                  </span>
                  {isMemo && (
                    <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium">
                      memorando
                    </span>
                  )}
                </div>
                <span className="text-xs text-stone-600 leading-relaxed">{r.excerpt}</span>
              </button>
            );
          })}
        </div>

        {query.length < 2 && (
          <p className="text-xs text-stone-400 text-center py-6">
            Digite pelo menos 2 caracteres para buscar
          </p>
        )}
      </div>
    </div>
  );
}
