"use client";

import React, { useState } from "react";
import { Ic, ic } from "./icons";
import type { Theme, Code } from "./types";

interface ThemePanelProps {
  themes: Theme[];
  codes: Code[];
  onNewTheme: () => void;
  onDeleteTheme: (id: string) => void;
  onToggleThemeCode: (themeId: string, codeId: string, has: boolean) => void;
  onManageThemes: () => void;
}

export function ThemePanel({ themes, codes, onNewTheme, onDeleteTheme, onToggleThemeCode, onManageThemes }: ThemePanelProps) {
  const [showEditTheme, setShowEditTheme] = useState<string | null>(null);
  const allCodes = codes.flatMap((c) => [c, ...(c.children || [])]);

  return (
    <>
      <div className="p-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Temas ({themes.length})
        </span>
        <div className="flex gap-1">
          <button
            onClick={onManageThemes}
            className="px-2 py-1 text-[11px] text-stone-500 hover:text-trama-500 border border-stone-200 rounded-md hover:border-trama-300 transition"
            title="Gerenciar Temas"
          >
            <Ic d={ic.grid} className="w-3 h-3" />
          </button>
          <button
            onClick={onNewTheme}
            className="px-2.5 py-1 bg-trama-500 hover:bg-trama-600 text-white text-[11px] font-medium rounded-md flex items-center gap-1 transition"
          >
            <Ic d={ic.plus} className="w-3 h-3" />
            Novo
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        {themes.length === 0 && (
          <div className="text-center py-6">
            <p className="text-xs text-stone-400 mb-2">Nenhum tema criado.</p>
            <button onClick={onManageThemes} className="text-xs text-trama-500 font-medium hover:underline">
              Gerenciar Temas
            </button>
          </div>
        )}

        {themes.map((theme) => (
          <div key={theme.id} className="mb-3 border border-stone-100 rounded-lg p-3 hover:border-stone-200 transition">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-3 h-3 rounded-full shrink-0" style={{ background: theme.color }} />
              <span className="text-sm font-medium text-stone-700 flex-1">{theme.name}</span>
              <button
                onClick={() => setShowEditTheme(showEditTheme === theme.id ? null : theme.id)}
                className="text-[10px] text-stone-400 hover:text-trama-500 px-1.5 py-0.5 rounded border border-stone-200"
              >
                editar
              </button>
              <button onClick={() => onDeleteTheme(theme.id)} className="text-stone-300 hover:text-red-400">
                <Ic d={ic.x} className="w-3 h-3" />
              </button>
            </div>

            {theme.description && (
              <p className="text-xs text-stone-400 mb-2 leading-relaxed">{theme.description}</p>
            )}

            <div className="flex flex-wrap gap-1">
              {theme.themeCodes.map((tc) => (
                <span
                  key={tc.code.id}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full"
                  style={{ background: `${tc.code.color}15`, color: tc.code.color }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: tc.code.color }} />
                  {tc.code.name}
                </span>
              ))}
              {theme.themeCodes.length === 0 && (
                <span className="text-[11px] text-stone-400 italic">Nenhum código associado</span>
              )}
            </div>

            {/* Edit theme — associate codes */}
            {showEditTheme === theme.id && (
              <div className="mt-3 pt-3 border-t border-stone-100">
                <p className="text-[11px] font-medium text-stone-500 mb-2">Códigos deste tema:</p>
                {allCodes.map((code) => {
                  const has = theme.themeCodes.some((tc) => tc.code.id === code.id);
                  return (
                    <button
                      key={code.id}
                      onClick={() => onToggleThemeCode(theme.id, code.id, has)}
                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-left hover:bg-stone-50 transition"
                    >
                      <span
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 ${
                          has ? "border-transparent" : "border-stone-300"
                        }`}
                        style={has ? { background: code.color } : {}}
                      >
                        {has && <Ic d={ic.check} className="w-2.5 h-2.5 text-white" />}
                      </span>
                      <span className="w-2 h-2 rounded-full" style={{ background: code.color }} />
                      <span className="text-xs text-stone-600">{code.name}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </>
  );
}
