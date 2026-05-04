"use client";

import React, { useState } from "react";
import { Ic, ic } from "./icons";
import { LinkedMemos } from "./LinkedMemos";
import type { Doc, Coding, Theme } from "./types";

interface TextReaderProps {
  doc: Doc | undefined;
  projectId: string;
  codings: Coding[];
  themes: Theme[];
  themeFilter: string | null;
  filteredCodeIds: string[] | null;
  onThemeFilterChange: (id: string | null) => void;
  onTextSelect: () => void;
  onRemoveCoding: (id: string) => void;
  onUpload: () => void;
  onSaveMemo: (id: string, title: string, content: string) => void;
  onNavigateToDoc: (docId: string) => void;
}

export function TextReader({
  doc,
  projectId,
  codings,
  themes,
  themeFilter,
  filteredCodeIds,
  onThemeFilterChange,
  onTextSelect,
  onRemoveCoding,
  onUpload,
  onSaveMemo,
  onNavigateToDoc,
}: TextReaderProps) {
  const [showThemeFilter, setShowThemeFilter] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const activeThemeName = themeFilter ? themes.find((t) => t.id === themeFilter)?.name : null;

  const isMemo = doc?.type === "MEMO";

  function startEditing() {
    if (!doc) return;
    setEditTitle(doc.title);
    setEditContent(doc.content);
    setIsEditing(true);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditTitle("");
    setEditContent("");
  }

  function handleSave() {
    if (!doc) return;
    onSaveMemo(doc.id, editTitle, editContent);
    setIsEditing(false);
  }

  function renderText(content: string) {
    if (!codings.length) return content;

    const sorted = [...codings].sort((a, b) => a.startOffset - b.startOffset);
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    sorted.forEach((c, i) => {
      if (c.startOffset > cursor) parts.push(content.slice(cursor, c.startOffset));
      const dimmed = filteredCodeIds && !filteredCodeIds.includes(c.code.id);

      parts.push(
        <span
          key={i}
          className={`cursor-pointer rounded-sm relative group ${dimmed ? "opacity-20" : ""}`}
          style={{ background: `${c.code.color}20`, borderBottom: `2px solid ${c.code.color}` }}
          title={`${c.code.name}${c.memo ? ` — ${c.memo}` : ""}`}
        >
          {content.slice(c.startOffset, c.endOffset)}
          {!dimmed && (
            <span className="hidden group-hover:flex absolute -top-8 left-0 bg-stone-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: c.code.color }} />
              {c.code.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemoveCoding(c.id);
                }}
                className="ml-1 text-stone-400 hover:text-white"
              >
                ✕
              </button>
            </span>
          )}
        </span>
      );
      cursor = c.endOffset;
    });

    if (cursor < content.length) parts.push(content.slice(cursor));
    return parts;
  }

  if (!doc) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-stone-400 mb-2">Selecione ou adicione um documento.</p>
          <button onClick={onUpload} className="text-sm text-trama-500 font-medium">
            Upload
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-2 border-b border-stone-200 bg-white flex items-center gap-3 shrink-0">
        {isMemo && (
          <span className="text-[10px] bg-amber-100 text-amber-600 px-2 py-0.5 rounded-full font-semibold shrink-0">
            MEMORANDO
          </span>
        )}

        {isEditing ? (
          <input
            value={editTitle}
            onChange={(e) => setEditTitle(e.target.value)}
            className="text-xs font-medium text-stone-600 bg-stone-50 border border-stone-200 rounded px-2 py-1 flex-1 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
          />
        ) : (
          <span className="text-xs font-medium text-stone-600 truncate">{doc.title}</span>
        )}

        {doc.fileName && !isMemo && (
          <span className="text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded">{doc.fileName}</span>
        )}

        {/* Linked document badge */}
        {isMemo && doc.linkedDocument && !isEditing && (
          <button
            onClick={() => onNavigateToDoc(doc.linkedDocument!.id)}
            className="flex items-center gap-1 text-[10px] text-stone-400 bg-stone-50 px-2 py-0.5 rounded hover:bg-stone-100 transition"
          >
            <Ic d={ic.link} className="w-2.5 h-2.5" />
            {doc.linkedDocument.title}
          </button>
        )}

        <div className="flex-1" />

        {/* Edit/Save buttons for memos */}
        {isMemo && !isEditing && (
          <button
            onClick={startEditing}
            className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100 transition"
          >
            <Ic d={ic.edit} className="w-3 h-3" />
            Editar
          </button>
        )}

        {isEditing && (
          <div className="flex gap-1.5">
            <button
              onClick={cancelEditing}
              className="px-2 py-1 text-[11px] text-stone-500 rounded-md border border-stone-200 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!editTitle.trim() || !editContent.trim()}
              className="flex items-center gap-1 px-2 py-1 text-[11px] rounded-md bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50 transition"
            >
              <Ic d={ic.save} className="w-3 h-3" />
              Salvar
            </button>
          </div>
        )}

        {/* Linked memos indicator (for source docs) */}
        {!isMemo && (
          <LinkedMemos projectId={projectId} documentId={doc.id} onNavigate={onNavigateToDoc} />
        )}

        {/* Theme filter */}
        {!isEditing && (
          <div className="relative">
            <button
              onClick={() => setShowThemeFilter(!showThemeFilter)}
              className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md border transition ${
                themeFilter
                  ? "bg-trama-50 border-trama-300 text-trama-600"
                  : "border-stone-200 text-stone-400 hover:border-stone-300"
              }`}
            >
              <Ic d={ic.filter} className="w-3 h-3" />
              {activeThemeName || "Filtro"}
              {themeFilter && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onThemeFilterChange(null);
                    setShowThemeFilter(false);
                  }}
                  className="ml-1 hover:text-trama-700"
                >
                  ✕
                </button>
              )}
            </button>

            {showThemeFilter && (
              <div className="absolute right-0 top-8 bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-52 z-40">
                <button
                  onClick={() => { onThemeFilterChange(null); setShowThemeFilter(false); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 ${!themeFilter ? "font-medium text-trama-500" : "text-stone-600"}`}
                >
                  Sem filtro
                </button>
                {themes.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { onThemeFilterChange(t.id); setShowThemeFilter(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-stone-50 flex items-center gap-2 ${themeFilter === t.id ? "font-medium text-trama-500" : "text-stone-600"}`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: t.color }} />
                    {t.name}
                    <span className="ml-auto text-xs text-stone-400">{t.themeCodes.length} cód.</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <span className="text-[11px] text-stone-400">
          {isEditing
            ? `${editContent.split(/\s+/).filter(Boolean).length} palavras`
            : `${doc.wordCount} palavras`}
        </span>
      </div>

      {/* Media player */}
      {doc.fileUrl && (doc.type === "AUDIO" || doc.type === "VIDEO") && (
        <div className="bg-stone-50 border-b border-stone-200 p-4">
          {doc.type === "AUDIO" ? (
            <audio controls className="w-full" src={doc.fileUrl} />
          ) : (
            <video controls className="w-full max-h-64 rounded-lg bg-black" src={doc.fileUrl} />
          )}
        </div>
      )}

      {/* Text area */}
      <div className="flex-1 overflow-y-auto bg-white p-8 scrollbar-thin">
        {isEditing ? (
          <textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="max-w-2xl mx-auto w-full h-full leading-[1.9] text-[15px] text-stone-800 font-mono resize-none outline-none border border-stone-200 rounded-lg p-4 focus:ring-2 focus:ring-amber-500/20"
          />
        ) : (
          <div
            id="text-reader"
            className="max-w-2xl mx-auto leading-[1.9] text-[15px] text-stone-800 whitespace-pre-wrap"
            onMouseUp={onTextSelect}
          >
            {renderText(doc.content)}
          </div>
        )}
      </div>
    </div>
  );
}
