"use client";

import React, { useState } from "react";
import { Ic, ic } from "./icons";
import type { Doc } from "./types";

type DocFilter = "all" | "sources" | "memos";

interface DocumentPanelProps {
  documents: Doc[];
  activeDocIdx: number;
  onSelect: (idx: number) => void;
  onUpload: () => void;
  onAddDoc: () => void;
  onNewMemo: () => void;
}

function docIcon(doc: Doc): string {
  if (doc.type === "MEMO") return ic.memo;
  if (doc.type === "AUDIO") return ic.music;
  if (doc.type === "VIDEO") return ic.film;
  return ic.doc;
}

export function DocumentPanel({ documents, activeDocIdx, onSelect, onUpload, onAddDoc, onNewMemo }: DocumentPanelProps) {
  const [filter, setFilter] = useState<DocFilter>("all");

  const memoCount = documents.filter((d) => d.type === "MEMO").length;
  const sourceCount = documents.length - memoCount;

  const filtered = documents.filter((d) => {
    if (filter === "sources") return d.type !== "MEMO";
    if (filter === "memos") return d.type === "MEMO";
    return true;
  });

  // Map filtered index back to original index
  function originalIdx(filteredIdx: number): number {
    const doc = filtered[filteredIdx];
    return documents.findIndex((d) => d.id === doc.id);
  }

  return (
    <div className="w-[20%] min-w-[180px] border-r border-stone-200 bg-white flex flex-col overflow-hidden">
      <div className="p-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Documentos</span>
        <div className="flex gap-1">
          <button onClick={onUpload} className="p-1 rounded bg-stone-50 hover:bg-trama-50 text-trama-500" title="Upload">
            <Ic d={ic.upload} className="w-3.5 h-3.5" />
          </button>
          <button onClick={onAddDoc} className="p-1 rounded bg-stone-50 hover:bg-trama-50 text-trama-500" title="Colar texto">
            <Ic d={ic.plus} className="w-3.5 h-3.5" />
          </button>
          <button onClick={onNewMemo} className="p-1 rounded bg-amber-50 hover:bg-amber-100 text-amber-500" title="Novo memorando">
            <Ic d={ic.memo} className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      {memoCount > 0 && (
        <div className="px-3 pb-2 flex gap-1">
          {([
            { key: "all" as const, label: "Todos", count: documents.length },
            { key: "sources" as const, label: "Fontes", count: sourceCount },
            { key: "memos" as const, label: "Memos", count: memoCount },
          ]).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`flex-1 text-[10px] py-1 rounded transition ${
                filter === f.key
                  ? "bg-stone-800 text-white font-medium"
                  : "bg-stone-50 text-stone-400 hover:bg-stone-100"
              }`}
            >
              {f.label} ({f.count})
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {documents.length === 0 && (
          <div className="p-4 text-center">
            <p className="text-xs text-stone-400 mb-2">Nenhum documento.</p>
            <button onClick={onUpload} className="text-xs text-trama-500 font-medium">
              Upload
            </button>
          </div>
        )}

        {filtered.map((doc, fi) => {
          const oi = originalIdx(fi);
          const isMemo = doc.type === "MEMO";
          return (
            <button
              key={doc.id}
              onClick={() => onSelect(oi)}
              className={`w-full text-left px-3 py-2.5 transition border-l-[3px] ${
                activeDocIdx === oi
                  ? isMemo
                    ? "bg-amber-50 border-amber-400"
                    : "bg-orange-50 border-argila"
                  : "border-transparent hover:bg-stone-50"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <Ic
                  d={docIcon(doc)}
                  className={`w-3 h-3 shrink-0 ${
                    activeDocIdx === oi
                      ? isMemo ? "text-amber-500" : "text-argila"
                      : isMemo ? "text-amber-300" : "text-stone-300"
                  }`}
                />
                <span className={`text-xs truncate ${activeDocIdx === oi ? "font-medium text-stone-800" : "text-stone-600"}`}>
                  {doc.title}
                </span>
                {isMemo && (
                  <span className="text-[9px] bg-amber-100 text-amber-600 px-1.5 py-0.5 rounded-full font-medium shrink-0">
                    memo
                  </span>
                )}
              </div>
              <div className="flex gap-3 pl-[18px]">
                <span className="text-[11px] text-stone-400">
                  {doc.type === "AUDIO" || doc.type === "VIDEO" ? doc.type.toLowerCase() : `${doc.wordCount} pal.`}
                </span>
                <span className="text-[11px] text-stone-400">{doc._count.codings} cód.</span>
              </div>
              {isMemo && doc.linkedDocument && (
                <div className="flex items-center gap-1 pl-[18px] mt-0.5">
                  <Ic d={ic.link} className="w-2.5 h-2.5 text-stone-300" />
                  <span className="text-[10px] text-stone-300 truncate">{doc.linkedDocument.title}</span>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
