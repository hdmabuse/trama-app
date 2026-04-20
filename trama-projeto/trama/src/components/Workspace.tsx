"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";

type Code = {
  id: string;
  name: string;
  color: string;
  description: string | null;
  _count: { codings: number };
  children?: Code[];
};

type Document = {
  id: string;
  title: string;
  content: string;
  wordCount: number;
  _count: { codings: number };
};

type Coding = {
  id: string;
  startOffset: number;
  endOffset: number;
  selectedText: string;
  memo: string | null;
  code: { id: string; name: string; color: string };
};

type Project = {
  id: string;
  name: string;
  color: string;
  documents: Document[];
  codes: Code[];
};

export function Workspace({ project, userId }: { project: Project; userId: string }) {
  const router = useRouter();
  const [activeDocIdx, setActiveDocIdx] = useState(0);
  const [codings, setCodings] = useState<Coding[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const [expandedCodes, setExpandedCodes] = useState<string[]>(project.codes.filter(c => c.children?.length).map(c => c.id));
  const [showNewCode, setShowNewCode] = useState(false);
  const [newCodeName, setNewCodeName] = useState("");
  const [newCodeColor, setNewCodeColor] = useState("#6366f1");
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [searchCode, setSearchCode] = useState("");

  const activeDoc = project.documents[activeDocIdx];
  const colors = ["#ef4444","#10b981","#6366f1","#f59e0b","#ec4899","#8b5cf6","#14b8a6","#C97B5D"];

  // Load codings for active document
  const loadCodings = useCallback(async () => {
    if (!activeDoc) return;
    const res = await fetch(`/api/codificacoes?documentId=${activeDoc.id}`);
    if (res.ok) setCodings(await res.json());
  }, [activeDoc]);

  useEffect(() => { loadCodings(); }, [loadCodings]);

  // Handle text selection in reader
  function handleTextSelect() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const reader = document.getElementById("text-reader");
    if (!reader) return;

    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(reader);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + sel.toString().length;

    setSelection({ text: sel.toString(), start: startOffset, end: endOffset });
    setShowPopup(true);
  }

  // Apply coding
  async function applyCoding(codeId: string, memo: string) {
    if (!activeDoc || !selection) return;
    await fetch("/api/codificacoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        documentId: activeDoc.id,
        codeId,
        startOffset: selection.start,
        endOffset: selection.end,
        selectedText: selection.text,
        memo: memo || null,
      }),
    });
    setShowPopup(false);
    setSelection(null);
    window.getSelection()?.removeAllRanges();
    loadCodings();
    router.refresh();
  }

  // Remove coding
  async function removeCoding(id: string) {
    await fetch(`/api/codificacoes?id=${id}`, { method: "DELETE" });
    loadCodings();
    router.refresh();
  }

  // Create code
  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/codigos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCodeName, color: newCodeColor, projectId: project.id }),
    });
    setShowNewCode(false);
    setNewCodeName("");
    router.refresh();
  }

  // Add document
  async function addDocument(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/documentos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newDocTitle, content: newDocContent, projectId: project.id }),
    });
    setShowAddDoc(false);
    setNewDocTitle("");
    setNewDocContent("");
    router.refresh();
  }

  // Render text with highlights
  function renderText(content: string) {
    if (!codings.length) return content;
    const sorted = [...codings].sort((a, b) => a.startOffset - b.startOffset);
    const parts: React.ReactNode[] = [];
    let cursor = 0;

    sorted.forEach((c, i) => {
      if (c.startOffset > cursor) {
        parts.push(content.slice(cursor, c.startOffset));
      }
      parts.push(
        <span
          key={i}
          className="cursor-pointer rounded-sm relative group"
          style={{
            background: `${c.code.color}20`,
            borderBottom: `2px solid ${c.code.color}`,
          }}
          title={`${c.code.name}${c.memo ? ` — ${c.memo}` : ""}`}
        >
          {content.slice(c.startOffset, c.endOffset)}
          <span
            className="hidden group-hover:flex absolute -top-8 left-0 bg-stone-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 items-center gap-2"
          >
            <span className="w-2 h-2 rounded-full" style={{ background: c.code.color }} />
            {c.code.name}
            <button
              onClick={(e) => { e.stopPropagation(); removeCoding(c.id); }}
              className="ml-1 text-stone-400 hover:text-white"
            >
              ✕
            </button>
          </span>
        </span>
      );
      cursor = c.endOffset;
    });

    if (cursor < content.length) {
      parts.push(content.slice(cursor));
    }

    return parts;
  }

  const filteredCodes = project.codes.filter(c =>
    !searchCode || c.name.toLowerCase().includes(searchCode.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-11 bg-white border-b border-stone-200 flex items-center px-4 gap-3 shrink-0">
        <span className="text-sm font-semibold text-stone-800">{project.name}</span>
        <div className="flex-1" />
        <span className="text-xs text-stone-400">
          {project.documents.length} doc{project.documents.length !== 1 && "s"} · {project.codes.length} código{project.codes.length !== 1 && "s"}
        </span>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* LEFT — Documents */}
        <div className="w-[20%] min-w-[180px] border-r border-stone-200 bg-white flex flex-col overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Documentos</span>
            <button
              onClick={() => setShowAddDoc(true)}
              className="p-1 rounded bg-stone-50 hover:bg-trama-50 text-trama-500"
              title="Adicionar documento"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {project.documents.length === 0 && (
              <div className="p-4 text-center">
                <p className="text-xs text-stone-400 mb-2">Nenhum documento ainda.</p>
                <button onClick={() => setShowAddDoc(true)} className="text-xs text-trama-500 font-medium">
                  Adicionar documento
                </button>
              </div>
            )}
            {project.documents.map((doc, i) => (
              <button
                key={doc.id}
                onClick={() => setActiveDocIdx(i)}
                className={`w-full text-left px-3 py-2.5 transition border-l-[3px] ${
                  activeDocIdx === i
                    ? "bg-orange-50 border-argila"
                    : "border-transparent hover:bg-stone-50"
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <svg className={`w-3 h-3 shrink-0 ${activeDocIdx === i ? "text-argila" : "text-stone-300"}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6" />
                  </svg>
                  <span className={`text-xs truncate ${activeDocIdx === i ? "font-medium text-stone-800" : "text-stone-600"}`}>
                    {doc.title}
                  </span>
                </div>
                <div className="flex gap-3 pl-[18px]">
                  <span className="text-[11px] text-stone-400">{doc.wordCount} palavras</span>
                  <span className="text-[11px] text-stone-400">{doc._count.codings} códigos</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* CENTER — Text reader */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {activeDoc ? (
            <>
              <div className="px-4 py-2 border-b border-stone-200 bg-white flex items-center gap-3 shrink-0">
                <span className="text-xs font-medium text-stone-600 truncate">{activeDoc.title}</span>
                <div className="flex-1" />
                <span className="text-[11px] text-stone-400">{activeDoc.wordCount} palavras</span>
              </div>
              <div className="flex-1 overflow-y-auto bg-white p-8 scrollbar-thin">
                <div
                  id="text-reader"
                  className="max-w-2xl mx-auto leading-[1.9] text-[15px] text-stone-800 whitespace-pre-wrap"
                  onMouseUp={handleTextSelect}
                >
                  {renderText(activeDoc.content)}
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <p className="text-sm text-stone-400 mb-2">Selecione ou adicione um documento para começar.</p>
                <button onClick={() => setShowAddDoc(true)} className="text-sm text-trama-500 font-medium">
                  Adicionar documento
                </button>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Codes panel */}
        <div className="w-[28%] min-w-[240px] border-l border-stone-200 bg-white flex flex-col overflow-hidden">
          <div className="p-3 flex items-center justify-between">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">Códigos</span>
            <button
              onClick={() => setShowNewCode(true)}
              className="px-2.5 py-1 bg-trama-500 hover:bg-trama-600 text-white text-[11px] font-medium rounded-md flex items-center gap-1 transition"
            >
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 5v14M5 12h14" />
              </svg>
              Novo
            </button>
          </div>

          <div className="px-3 pb-2">
            <div className="flex items-center bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 gap-1.5">
              <svg className="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value)}
                placeholder="Buscar código..."
                className="bg-transparent text-xs flex-1 outline-none"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
            {filteredCodes.length === 0 && (
              <p className="text-xs text-stone-400 text-center py-4">Nenhum código criado.</p>
            )}
            {filteredCodes.map((code) => (
              <div key={code.id} className="mb-0.5">
                <button
                  onClick={() => {
                    if (code.children?.length) {
                      setExpandedCodes((s) =>
                        s.includes(code.id) ? s.filter((x) => x !== code.id) : [...s, code.id]
                      );
                    }
                  }}
                  className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-stone-50 transition text-left"
                >
                  {code.children?.length ? (
                    <svg
                      className={`w-3 h-3 text-stone-400 transition ${expandedCodes.includes(code.id) ? "rotate-90" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 18l6-6-6-6" />
                    </svg>
                  ) : <span className="w-3" />}
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: code.color }} />
                  <span className="text-sm text-stone-700 flex-1">{code.name}</span>
                  <span className="text-xs text-stone-400 bg-stone-50 rounded-full px-2 py-0.5">
                    {code._count.codings}
                  </span>
                </button>
                {code.children?.length && expandedCodes.includes(code.id) ? (
                  code.children.map((child: any) => (
                    <div key={child.id} className="flex items-center gap-2 pl-9 pr-2 py-1.5">
                      <span className="w-2 h-2 rounded-full opacity-60" style={{ background: child.color }} />
                      <span className="text-xs text-stone-500 flex-1">{child.name}</span>
                      <span className="text-[11px] text-stone-400">{child._count?.codings ?? 0}</span>
                    </div>
                  ))
                ) : null}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="border-t border-stone-200 p-3">
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2.5">Estatísticas</span>
            {project.codes.slice(0, 5).map((code) => {
              const max = Math.max(...project.codes.map((c) => c._count.codings), 1);
              return (
                <div key={code.id} className="mb-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-[11px] text-stone-500">{code.name}</span>
                    <span className="text-[11px] text-stone-400">{code._count.codings}</span>
                  </div>
                  <div className="bg-stone-100 rounded-sm h-1 overflow-hidden">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{ width: `${(code._count.codings / max) * 100}%`, background: code.color }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ===== Coding Popup ===== */}
      {showPopup && selection && (
        <CodingPopup
          codes={project.codes}
          selectedText={selection.text}
          onApply={applyCoding}
          onClose={() => { setShowPopup(false); setSelection(null); }}
        />
      )}

      {/* ===== New Code Modal ===== */}
      {showNewCode && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowNewCode(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={createCode} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-stone-800 mb-4">Novo código</h3>
            <input
              value={newCodeName}
              onChange={(e) => setNewCodeName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Nome do código"
              required
              autoFocus
            />
            <div className="flex gap-2 mb-5">
              {colors.map((c) => (
                <button
                  key={c} type="button" onClick={() => setNewCodeColor(c)}
                  className={`w-6 h-6 rounded-full transition ${newCodeColor === c ? "ring-2 ring-offset-2 ring-stone-400" : ""}`}
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewCode(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
              <button type="submit" disabled={!newCodeName} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Criar</button>
            </div>
          </form>
        </div>
      )}

      {/* ===== Add Document Modal ===== */}
      {showAddDoc && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={() => setShowAddDoc(false)}>
          <form onClick={(e) => e.stopPropagation()} onSubmit={addDocument} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg">
            <h3 className="text-base font-semibold text-stone-800 mb-4">Adicionar documento</h3>
            <input
              value={newDocTitle}
              onChange={(e) => setNewDocTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Título (ex: Transcrição P01 — Maria)"
              required
              autoFocus
            />
            <textarea
              value={newDocContent}
              onChange={(e) => setNewDocContent(e.target.value)}
              rows={10}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500 font-mono"
              placeholder="Cole aqui o texto da transcrição, survey, notas de campo..."
              required
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddDoc(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
              <button type="submit" disabled={!newDocTitle || !newDocContent} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Adicionar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ===== Coding Popup sub-component ===== */
function CodingPopup({
  codes,
  selectedText,
  onApply,
  onClose,
}: {
  codes: Code[];
  selectedText: string;
  onApply: (codeId: string, memo: string) => void;
  onClose: () => void;
}) {
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [memo, setMemo] = useState("");
  const [search, setSearch] = useState("");

  const allCodes = codes.flatMap((c) => [c, ...(c.children || [])]);
  const filtered = allCodes.filter((c) =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-sm font-semibold text-stone-800">Codificar trecho</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="bg-stone-50 rounded-lg p-3 mb-4 border-l-[3px] border-argila">
          <p className="text-xs text-stone-500 italic leading-relaxed line-clamp-3">
            &ldquo;{selectedText}&rdquo;
          </p>
          <span className="text-[11px] text-stone-400 mt-1.5 block">{selectedText.length} caracteres</span>
        </div>

        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 gap-1.5 mb-3">
          <svg className="w-3 h-3 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar código..."
            className="bg-transparent text-xs flex-1 outline-none"
            autoFocus
          />
        </div>

        <div className="max-h-48 overflow-y-auto mb-4 scrollbar-thin">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedCode(c.id)}
              className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md mb-0.5 transition text-left ${
                selectedCode === c.id ? "bg-stone-100" : "hover:bg-stone-50"
              }`}
            >
              <span
                className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition ${
                  selectedCode === c.id ? "border-transparent" : "border-stone-300"
                }`}
                style={selectedCode === c.id ? { background: c.color } : {}}
              >
                {selectedCode === c.id && (
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M20 6L9 17l-5-5" />
                  </svg>
                )}
              </span>
              <span className="w-2 h-2 rounded-full" style={{ background: c.color }} />
              <span className="text-sm text-stone-700">{c.name}</span>
            </button>
          ))}
        </div>

        <label className="text-[11px] font-medium text-stone-400 uppercase tracking-wider block mb-1.5">
          Memo (opcional)
        </label>
        <textarea
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={2}
          placeholder="Adicionar nota sobre este trecho..."
          className="w-full px-3 py-2 rounded-lg border border-stone-200 text-xs resize-none mb-4 focus:outline-none focus:ring-2 focus:ring-trama-500/30"
        />

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
          <button
            onClick={() => selectedCode && onApply(selectedCode, memo)}
            disabled={!selectedCode}
            className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
}
