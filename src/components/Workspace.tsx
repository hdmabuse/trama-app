"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { exportPDF, exportMarkdown } from "@/lib/export";
import {
  DocumentPanel,
  TextReader,
  CodePanel,
  ThemePanel,
  CodingPopup,
  UploadModal,
  SearchModal,
  MemoModal,
  ThemeManager,
  ThemeGraph,
  Modal,
  Ic,
  ic,
  COLORS,
} from "./workspace";
import type { Project, Coding, WorkspaceView } from "./workspace";

export function Workspace({ project, userId }: { project: Project; userId: string }) {
  const router = useRouter();

  // Core state
  const [activeDocIdx, setActiveDocIdx] = useState(0);
  const [codings, setCodings] = useState<Coding[]>([]);
  const [showCodingPopup, setShowCodingPopup] = useState(false);
  const [selection, setSelection] = useState<{ text: string; start: number; end: number } | null>(null);
  const [rightTab, setRightTab] = useState<"codes" | "themes">("codes");
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // View switching: document (normal), themes (manager), graph
  const [view, setView] = useState<WorkspaceView>("document");

  // Modal visibility
  const [showUpload, setShowUpload] = useState(false);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [showNewCode, setShowNewCode] = useState(false);
  const [showNewTheme, setShowNewTheme] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNewMemo, setShowNewMemo] = useState(false);

  // Form state
  const [newCodeName, setNewCodeName] = useState("");
  const [newCodeColor, setNewCodeColor] = useState("#6366f1");
  const [newDocTitle, setNewDocTitle] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newThemeName, setNewThemeName] = useState("");
  const [newThemeColor, setNewThemeColor] = useState("#8b5cf6");
  const [newThemeDesc, setNewThemeDesc] = useState("");

  const activeDoc = project.documents[activeDocIdx];

  // ⌘K shortcut
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  // Load codings for active document
  const loadCodings = useCallback(async () => {
    if (!activeDoc) { setCodings([]); return; }
    try {
      const r = await fetch(`/api/codificacoes?documentId=${activeDoc.id}`);
      if (r.ok) {
        const data = await r.json();
        setCodings(data);
      }
    } catch (err) {
      console.error("Erro ao carregar codificações:", err);
    }
  }, [activeDoc?.id]); // depend on id, not object reference

  useEffect(() => {
    loadCodings();
  }, [loadCodings]);

  // Filtered code IDs for theme filter
  const filteredCodeIds = themeFilter
    ? project.themes.find((t) => t.id === themeFilter)?.themeCodes.map((tc) => tc.code.id) || []
    : null;

  // ── BUG 1 FIX: Properly handle text selection and coding application ──
  function handleTextSelect() {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const reader = document.getElementById("text-reader");
    if (!reader) return;

    const selectedText = sel.toString();

    // Calculate offset relative to text content
    const range = sel.getRangeAt(0);
    const preRange = document.createRange();
    preRange.selectNodeContents(reader);
    preRange.setEnd(range.startContainer, range.startOffset);
    const startOffset = preRange.toString().length;
    const endOffset = startOffset + selectedText.length;

    // Save selection to state BEFORE showing popup
    setSelection({ text: selectedText, start: startOffset, end: endOffset });
    setShowCodingPopup(true);
  }

  // BUG 1 FIX: applyCoding is now async and properly awaited
  async function applyCoding(codeId: string, memo: string): Promise<void> {
    if (!activeDoc || !selection) return;

    const payload = {
      documentId: activeDoc.id,
      codeId,
      startOffset: selection.start,
      endOffset: selection.end,
      selectedText: selection.text,
      memo: memo || null,
    };

    try {
      const r = await fetch("/api/codificacoes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const err = await r.text();
        console.error("Erro ao aplicar codificação:", err);
        return;
      }
    } catch (err) {
      console.error("Erro ao aplicar codificação:", err);
      return;
    }

    // Close popup and clear selection
    setShowCodingPopup(false);
    setSelection(null);
    window.getSelection()?.removeAllRanges();

    // Reload codings THEN refresh page data
    await loadCodings();
    router.refresh();
  }

  async function removeCoding(id: string) {
    try {
      await fetch(`/api/codificacoes?id=${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Erro ao remover codificação:", err);
    }
    await loadCodings();
    router.refresh();
  }

  async function createCodeInline(name: string, color: string): Promise<string | null> {
    try {
      const r = await fetch("/api/codigos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, projectId: project.id }),
      });
      if (!r.ok) return null;
      const c = await r.json();
      router.refresh();
      return c.id;
    } catch {
      return null;
    }
  }

  async function createCode(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/codigos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCodeName, color: newCodeColor, projectId: project.id }),
      });
    } catch (err) {
      console.error("Erro ao criar código:", err);
    }
    setShowNewCode(false);
    setNewCodeName("");
    router.refresh();
  }

  async function addDocument(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/documentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: newDocTitle, content: newDocContent, projectId: project.id }),
      });
    } catch (err) {
      console.error("Erro ao adicionar documento:", err);
    }
    setShowAddDoc(false);
    setNewDocTitle("");
    setNewDocContent("");
    router.refresh();
  }

  async function createTheme(e: React.FormEvent) {
    e.preventDefault();
    try {
      await fetch("/api/temas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newThemeName, color: newThemeColor, description: newThemeDesc || null, projectId: project.id }),
      });
    } catch (err) {
      console.error("Erro ao criar tema:", err);
    }
    setShowNewTheme(false);
    setNewThemeName("");
    setNewThemeDesc("");
    router.refresh();
  }

  async function deleteTheme(id: string) {
    try {
      await fetch(`/api/temas/${id}`, { method: "DELETE" });
    } catch (err) {
      console.error("Erro ao deletar tema:", err);
    }
    if (themeFilter === id) setThemeFilter(null);
    router.refresh();
  }

  async function toggleThemeCode(themeId: string, codeId: string, has: boolean) {
    try {
      if (has) {
        await fetch(`/api/temas/${themeId}/codigos?codeId=${codeId}`, { method: "DELETE" });
      } else {
        await fetch(`/api/temas/${themeId}/codigos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codeIds: [codeId] }),
        });
      }
    } catch (err) {
      console.error("Erro ao alterar código do tema:", err);
    }
    router.refresh();
  }

  // ── BUG 2 FIX: createMemo returns success boolean, properly awaited ──
  async function createMemo(title: string, content: string, linkedDocumentId: string | null): Promise<boolean> {
    try {
      const r = await fetch("/api/memorandos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, projectId: project.id, linkedDocumentId }),
      });

      if (!r.ok) {
        const err = await r.text();
        console.error("Erro ao criar memorando:", err);
        return false;
      }
    } catch (err) {
      console.error("Erro ao criar memorando:", err);
      return false;
    }

    setShowNewMemo(false);
    router.refresh();
    return true;
  }

  async function saveMemo(id: string, title: string, content: string) {
    try {
      const r = await fetch(`/api/memorandos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content }),
      });
      if (!r.ok) console.error("Erro ao salvar memorando:", await r.text());
    } catch (err) {
      console.error("Erro ao salvar memorando:", err);
    }
    await loadCodings();
    router.refresh();
  }

  function navigateToDoc(docId: string) {
    const idx = project.documents.findIndex((d) => d.id === docId);
    if (idx >= 0) {
      setActiveDocIdx(idx);
      setView("document");
    }
  }

  // ── Theme Manager handlers ──
  async function createThemeWithCodes(name: string, description: string, color: string, codeIds: string[]) {
    try {
      const r = await fetch("/api/temas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, color, description: description || null, projectId: project.id }),
      });
      if (!r.ok) return;
      const theme = await r.json();

      // Add codes to theme
      if (codeIds.length > 0) {
        await fetch(`/api/temas/${theme.id}/codigos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ codeIds }),
        });
      }
    } catch (err) {
      console.error("Erro ao criar tema:", err);
    }
    router.refresh();
  }

  async function updateTheme(id: string, name: string, description: string, color: string) {
    try {
      await fetch(`/api/temas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description: description || null, color }),
      });
    } catch (err) {
      console.error("Erro ao atualizar tema:", err);
    }
    router.refresh();
  }

  // ── Export ──
  async function handleExport(fmt: "pdf" | "md") {
    setShowExportMenu(false);
    const allCodings: { documentTitle: string; codeName: string; selectedText: string; memo: string | null; isMemo: boolean }[] = [];

    for (const doc of project.documents) {
      try {
        const r = await fetch(`/api/codificacoes?documentId=${doc.id}`);
        if (r.ok) {
          const cs: Coding[] = await r.json();
          cs.forEach((c) =>
            allCodings.push({
              documentTitle: doc.title,
              codeName: c.code.name,
              selectedText: c.selectedText,
              memo: c.memo,
              isMemo: doc.type === "MEMO",
            })
          );
        }
      } catch (err) {
        console.error(`Erro ao carregar codificações de ${doc.title}:`, err);
      }
    }

    const allCodes = project.codes.flatMap((c) => [c, ...(c.children || [])]);
    const data = {
      projectName: project.name,
      projectDescription: project.description,
      documents: project.documents.filter((d) => d.type !== "MEMO").map((d) => ({ title: d.title, content: d.content, wordCount: d.wordCount, type: d.type })),
      memos: project.documents.filter((d) => d.type === "MEMO").map((d) => ({ title: d.title, content: d.content, wordCount: d.wordCount })),
      codes: allCodes.map((c) => ({ name: c.name, color: c.color, count: c._count.codings })),
      codings: allCodings,
      themes: project.themes.map((t) => ({ name: t.name, color: t.color, description: t.description, codes: t.themeCodes.map((tc) => tc.code.name) })),
    };

    if (fmt === "pdf") exportPDF(data);
    else exportMarkdown(data);
  }

  // ── Render ──
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Toolbar */}
      <div className="h-11 bg-white border-b border-stone-200 flex items-center px-4 gap-3 shrink-0">
        <span className="text-sm font-semibold text-stone-800">{project.name}</span>
        <div className="flex-1" />
        <button
          onClick={() => setShowSearch(true)}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs text-stone-400 bg-stone-50 border border-stone-200 rounded-md hover:border-stone-300 transition"
        >
          <Ic d={ic.search} className="w-3 h-3" />
          Buscar <kbd className="ml-1 text-[10px] bg-stone-100 px-1 rounded">⌘K</kbd>
        </button>
        <span className="text-xs text-stone-400">
          {project.documents.filter((d) => d.type !== "MEMO").length} doc{project.documents.filter((d) => d.type !== "MEMO").length !== 1 ? "s" : ""} ·{" "}
          {project.documents.filter((d) => d.type === "MEMO").length} memo{project.documents.filter((d) => d.type === "MEMO").length !== 1 ? "s" : ""} ·{" "}
          {project.codes.length} cód.
        </span>
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="px-3 py-1.5 bg-trama-500 hover:bg-trama-600 text-white text-xs font-medium rounded-md flex items-center gap-1.5 transition"
          >
            <Ic d={ic.download} className="w-3 h-3" />
            Exportar
          </button>
          {showExportMenu && (
            <div className="absolute right-0 top-9 bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-44 z-40">
              <button onClick={() => handleExport("pdf")} className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
                <span className="text-[10px] bg-red-100 text-red-600 font-mono px-1.5 py-0.5 rounded">PDF</span>Relatório
              </button>
              <button onClick={() => handleExport("md")} className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 flex items-center gap-2">
                <span className="text-[10px] bg-stone-100 text-stone-600 font-mono px-1.5 py-0.5 rounded">MD</span>Markdown
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left panel — always visible */}
        <DocumentPanel
          documents={project.documents}
          activeDocIdx={activeDocIdx}
          onSelect={(idx) => { setActiveDocIdx(idx); setView("document"); }}
          onUpload={() => setShowUpload(true)}
          onAddDoc={() => setShowAddDoc(true)}
          onNewMemo={() => setShowNewMemo(true)}
        />

        {/* Center + Right: depends on view */}
        {view === "document" && (
          <>
            <TextReader
              doc={activeDoc}
              projectId={project.id}
              codings={codings}
              themes={project.themes}
              themeFilter={themeFilter}
              filteredCodeIds={filteredCodeIds}
              onThemeFilterChange={setThemeFilter}
              onTextSelect={handleTextSelect}
              onRemoveCoding={removeCoding}
              onUpload={() => setShowUpload(true)}
              onSaveMemo={saveMemo}
              onNavigateToDoc={navigateToDoc}
            />

            {/* Right panel */}
            <div className="w-[28%] min-w-[260px] border-l border-stone-200 bg-white flex flex-col overflow-hidden">
              <div className="flex border-b border-stone-200 shrink-0">
                {(["codes", "themes"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setRightTab(tab)}
                    className={`flex-1 py-2.5 text-xs font-medium transition ${
                      rightTab === tab ? "text-trama-500 border-b-2 border-trama-500" : "text-stone-400 hover:text-stone-600"
                    }`}
                  >
                    {tab === "codes" ? "Códigos" : "Temas"}
                  </button>
                ))}
              </div>

              {rightTab === "codes" ? (
                <CodePanel codes={project.codes} onNewCode={() => setShowNewCode(true)} />
              ) : (
                <ThemePanel
                  themes={project.themes}
                  codes={project.codes}
                  onNewTheme={() => setShowNewTheme(true)}
                  onDeleteTheme={deleteTheme}
                  onToggleThemeCode={toggleThemeCode}
                  onManageThemes={() => setView("themes")}
                />
              )}
            </div>
          </>
        )}

        {view === "themes" && (
          <ThemeManager
            themes={project.themes}
            codes={project.codes}
            projectId={project.id}
            onCreateTheme={createThemeWithCodes}
            onUpdateTheme={updateTheme}
            onDeleteTheme={deleteTheme}
            onToggleThemeCode={toggleThemeCode}
            onViewGraph={() => setView("graph")}
            onBack={() => setView("document")}
          />
        )}

        {view === "graph" && (
          <ThemeGraph
            themes={project.themes}
            codes={project.codes}
            onBack={() => setView("themes")}
          />
        )}
      </div>

      {/* ── Modals ── */}
      {showCodingPopup && selection && (
        <CodingPopup
          codes={project.codes}
          selectedText={selection.text}
          onApply={applyCoding}
          onCreateCode={createCodeInline}
          onClose={() => { setShowCodingPopup(false); setSelection(null); }}
        />
      )}

      {showUpload && (
        <UploadModal
          projectId={project.id}
          onClose={() => setShowUpload(false)}
          onDone={() => { setShowUpload(false); router.refresh(); }}
        />
      )}

      {showSearch && (
        <SearchModal
          projectId={project.id}
          documents={project.documents}
          onNavigate={(idx) => { setActiveDocIdx(idx); setShowSearch(false); setView("document"); }}
          onClose={() => setShowSearch(false)}
        />
      )}

      {showNewMemo && (
        <MemoModal
          documents={project.documents}
          defaultLinkedDocId={activeDoc?.type !== "MEMO" ? activeDoc?.id : null}
          onClose={() => setShowNewMemo(false)}
          onSave={createMemo}
        />
      )}

      {showNewCode && (
        <Modal onClose={() => setShowNewCode(false)}>
          <form onSubmit={createCode} className="w-full max-w-sm">
            <h3 className="text-base font-semibold text-stone-800 mb-4">Novo código</h3>
            <input value={newCodeName} onChange={(e) => setNewCodeName(e.target.value)} autoFocus required
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Nome do código" />
            <div className="flex gap-2 mb-5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewCodeColor(c)}
                  className={`w-6 h-6 rounded-full transition ${newCodeColor === c ? "ring-2 ring-offset-2 ring-stone-400" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewCode(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
              <button type="submit" disabled={!newCodeName} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Criar</button>
            </div>
          </form>
        </Modal>
      )}

      {showNewTheme && (
        <Modal onClose={() => setShowNewTheme(false)}>
          <form onSubmit={createTheme} className="w-full max-w-sm">
            <h3 className="text-base font-semibold text-stone-800 mb-4">Novo tema</h3>
            <input value={newThemeName} onChange={(e) => setNewThemeName(e.target.value)} autoFocus required
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Nome do tema" />
            <textarea value={newThemeDesc} onChange={(e) => setNewThemeDesc(e.target.value)} rows={2}
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30"
              placeholder="Descrição (opcional)" />
            <div className="flex gap-2 mb-5">
              {COLORS.map((c) => (
                <button key={c} type="button" onClick={() => setNewThemeColor(c)}
                  className={`w-6 h-6 rounded-full transition ${newThemeColor === c ? "ring-2 ring-offset-2 ring-stone-400" : ""}`}
                  style={{ background: c }} />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowNewTheme(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
              <button type="submit" disabled={!newThemeName} className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Criar</button>
            </div>
          </form>
        </Modal>
      )}

      {showAddDoc && (
        <Modal onClose={() => setShowAddDoc(false)}>
          <form onSubmit={addDocument} className="w-full max-w-lg">
            <h3 className="text-base font-semibold text-stone-800 mb-4">Colar texto</h3>
            <input value={newDocTitle} onChange={(e) => setNewDocTitle(e.target.value)} autoFocus required
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30 focus:border-trama-500"
              placeholder="Título" />
            <textarea value={newDocContent} onChange={(e) => setNewDocContent(e.target.value)} rows={10} required
              className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-4 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30 font-mono"
              placeholder="Cole o texto aqui..." />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAddDoc(false)} className="px-3 py-1.5 text-sm text-stone-500">Cancelar</button>
              <button type="submit" disabled={!newDocTitle || !newDocContent}
                className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50">Adicionar</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
