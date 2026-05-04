"use client";

import React, { useState } from "react";
import { Ic, ic, COLORS } from "./icons";
import type { Theme, Code } from "./types";

interface ThemeManagerProps {
  themes: Theme[];
  codes: Code[];
  projectId: string;
  onCreateTheme: (name: string, description: string, color: string, codeIds: string[]) => Promise<void>;
  onUpdateTheme: (id: string, name: string, description: string, color: string) => Promise<void>;
  onDeleteTheme: (id: string) => Promise<void>;
  onToggleThemeCode: (themeId: string, codeId: string, has: boolean) => Promise<void>;
  onViewGraph: () => void;
  onBack: () => void;
}

export function ThemeManager({
  themes,
  codes,
  projectId,
  onCreateTheme,
  onUpdateTheme,
  onDeleteTheme,
  onToggleThemeCode,
  onViewGraph,
  onBack,
}: ThemeManagerProps) {
  const [selectedTheme, setSelectedTheme] = useState<string | null>(themes[0]?.id || null);
  const [showCreate, setShowCreate] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Create form
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newColor, setNewColor] = useState("#8b5cf6");
  const [newCodeIds, setNewCodeIds] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  // Edit form
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editColor, setEditColor] = useState("");

  const allCodes = codes.flatMap((c) => [c, ...(c.children || [])]);
  const active = themes.find((t) => t.id === selectedTheme);

  function startEdit(t: Theme) {
    setEditingId(t.id);
    setEditName(t.name);
    setEditDesc(t.description || "");
    setEditColor(t.color);
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setSaving(true);
    await onCreateTheme(newName.trim(), newDesc.trim(), newColor, newCodeIds);
    setShowCreate(false);
    setNewName("");
    setNewDesc("");
    setNewCodeIds([]);
    setSaving(false);
  }

  async function handleUpdate() {
    if (!editingId || !editName.trim()) return;
    setSaving(true);
    await onUpdateTheme(editingId, editName.trim(), editDesc.trim(), editColor);
    setEditingId(null);
    setSaving(false);
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir este tema? Os códigos não serão afetados.")) return;
    await onDeleteTheme(id);
    if (selectedTheme === id) setSelectedTheme(themes.find((t) => t.id !== id)?.id || null);
  }

  function toggleNewCode(codeId: string) {
    setNewCodeIds((prev) => (prev.includes(codeId) ? prev.filter((x) => x !== codeId) : [...prev, codeId]));
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-white">
      {/* Header */}
      <div className="px-6 py-4 border-b border-stone-200 flex items-center gap-3 shrink-0">
        <button onClick={onBack} className="p-1 rounded hover:bg-stone-100 text-stone-400 transition">
          <Ic d={ic.arrowLeft} className="w-4 h-4" />
        </button>
        <h2 className="text-base font-semibold text-stone-800 flex-1">Gestão de Temas</h2>
        <button
          onClick={onViewGraph}
          disabled={themes.length === 0}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-trama-500 hover:bg-trama-600 text-white text-xs font-medium rounded-md transition disabled:opacity-50"
        >
          <Ic d={ic.graph} className="w-3.5 h-3.5" />
          Ver como Grafo
        </button>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-900 text-white text-xs font-medium rounded-md transition"
        >
          <Ic d={ic.plus} className="w-3.5 h-3.5" />
          Novo Tema
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Themes list */}
        <div className="w-72 border-r border-stone-200 overflow-y-auto shrink-0">
          {themes.length === 0 && !showCreate && (
            <div className="p-6 text-center">
              <Ic d={ic.grid} className="w-8 h-8 text-stone-200 mx-auto mb-3" />
              <p className="text-sm text-stone-400 mb-2">Nenhum tema criado</p>
              <p className="text-xs text-stone-300 mb-4">
                Temas agrupam códigos para organizar sua análise.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="text-xs text-trama-500 font-medium hover:underline"
              >
                Criar primeiro tema
              </button>
            </div>
          )}

          {themes.map((t) => {
            const isActive = selectedTheme === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  setSelectedTheme(t.id);
                  setEditingId(null);
                }}
                className={`w-full text-left px-4 py-3.5 border-b border-stone-100 transition ${
                  isActive ? "bg-stone-50" : "hover:bg-stone-50/50"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: t.color }} />
                  <span className={`text-sm truncate ${isActive ? "font-semibold text-stone-800" : "text-stone-600"}`}>
                    {t.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 pl-5">
                  <span className="text-[11px] text-stone-400">
                    {t.themeCodes.length} código{t.themeCodes.length !== 1 && "s"}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Create form */}
          {showCreate && (
            <div className="max-w-lg">
              <h3 className="text-sm font-semibold text-stone-800 mb-4">Criar novo tema</h3>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-trama-500/30"
                placeholder="Nome do tema"
              />
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-3 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30"
                placeholder="Descrição (opcional)"
              />
              <div className="flex gap-2 mb-4">
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewColor(c)}
                    className={`w-6 h-6 rounded-full transition ${newColor === c ? "ring-2 ring-offset-2 ring-stone-400" : ""}`}
                    style={{ background: c }}
                  />
                ))}
              </div>

              <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-2">
                Selecionar códigos
              </p>
              <div className="grid grid-cols-2 gap-1 mb-4 max-h-48 overflow-y-auto">
                {allCodes.map((code) => {
                  const checked = newCodeIds.includes(code.id);
                  return (
                    <button
                      key={code.id}
                      onClick={() => toggleNewCode(code.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-left transition ${
                        checked ? "bg-stone-100" : "hover:bg-stone-50"
                      }`}
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          checked ? "border-transparent" : "border-stone-300"
                        }`}
                        style={checked ? { background: code.color } : {}}
                      >
                        {checked && <Ic d={ic.check} className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: code.color }} />
                      <span className="text-xs text-stone-600 truncate">{code.name}</span>
                      <span className="text-[10px] text-stone-400 ml-auto">{code._count.codings}</span>
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-2">
                <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 text-sm text-stone-500">
                  Cancelar
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || saving}
                  className="px-4 py-1.5 bg-trama-500 text-white text-sm font-medium rounded-lg disabled:opacity-50"
                >
                  {saving ? "Criando..." : "Criar tema"}
                </button>
              </div>
            </div>
          )}

          {/* Theme detail */}
          {!showCreate && active && (
            <div className="max-w-lg">
              {/* Header */}
              {editingId === active.id ? (
                <div className="mb-6">
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-trama-500/30"
                  />
                  <textarea
                    value={editDesc}
                    onChange={(e) => setEditDesc(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 text-sm mb-2 resize-none focus:outline-none focus:ring-2 focus:ring-trama-500/30"
                    placeholder="Descrição"
                  />
                  <div className="flex gap-2 mb-3">
                    {COLORS.map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setEditColor(c)}
                        className={`w-5 h-5 rounded-full transition ${editColor === c ? "ring-2 ring-offset-1 ring-stone-400" : ""}`}
                        style={{ background: c }}
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setEditingId(null)} className="px-3 py-1 text-xs text-stone-500">
                      Cancelar
                    </button>
                    <button
                      onClick={handleUpdate}
                      disabled={!editName.trim() || saving}
                      className="px-3 py-1 bg-trama-500 text-white text-xs font-medium rounded-md disabled:opacity-50"
                    >
                      {saving ? "Salvando..." : "Salvar"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="w-4 h-4 rounded-full shrink-0" style={{ background: active.color }} />
                    <h3 className="text-lg font-semibold text-stone-800">{active.name}</h3>
                    <button
                      onClick={() => startEdit(active)}
                      className="ml-auto p-1.5 rounded hover:bg-stone-100 text-stone-400 transition"
                      title="Editar"
                    >
                      <Ic d={ic.edit} className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(active.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-stone-400 hover:text-red-500 transition"
                      title="Excluir"
                    >
                      <Ic d={ic.trash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {active.description && (
                    <p className="text-sm text-stone-500 leading-relaxed">{active.description}</p>
                  )}
                </div>
              )}

              {/* Codes section */}
              <div>
                <p className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider mb-3">
                  Códigos neste tema ({active.themeCodes.length})
                </p>

                {/* Current codes */}
                {active.themeCodes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-4">
                    {active.themeCodes.map((tc) => (
                      <span
                        key={tc.code.id}
                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full"
                        style={{ background: `${tc.code.color}15`, color: tc.code.color }}
                      >
                        <span className="w-2 h-2 rounded-full" style={{ background: tc.code.color }} />
                        {tc.code.name}
                        <button
                          onClick={() => onToggleThemeCode(active.id, tc.code.id, true)}
                          className="ml-0.5 hover:opacity-70"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* All codes to add */}
                <p className="text-[11px] font-medium text-stone-400 mb-2">Adicionar ou remover códigos:</p>
                <div className="grid grid-cols-2 gap-1 max-h-64 overflow-y-auto">
                  {allCodes.map((code) => {
                    const has = active.themeCodes.some((tc) => tc.code.id === code.id);
                    return (
                      <button
                        key={code.id}
                        onClick={() => onToggleThemeCode(active.id, code.id, has)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-md text-left transition ${
                          has ? "bg-stone-100" : "hover:bg-stone-50"
                        }`}
                      >
                        <span
                          className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                            has ? "border-transparent" : "border-stone-300"
                          }`}
                          style={has ? { background: code.color } : {}}
                        >
                          {has && <Ic d={ic.check} className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: code.color }} />
                        <span className="text-xs text-stone-600 truncate flex-1">{code.name}</span>
                        <span className="text-[10px] text-stone-400">{code._count.codings}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!showCreate && !active && themes.length > 0 && (
            <p className="text-sm text-stone-400">Selecione um tema à esquerda.</p>
          )}
        </div>
      </div>
    </div>
  );
}
