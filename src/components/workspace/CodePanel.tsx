"use client";

import React, { useState } from "react";
import { Ic, ic } from "./icons";
import type { Code } from "./types";

interface CodePanelProps {
  codes: Code[];
  onNewCode: () => void;
}

export function CodePanel({ codes, onNewCode }: CodePanelProps) {
  const [searchCode, setSearchCode] = useState("");
  const [expandedCodes, setExpandedCodes] = useState<string[]>(
    codes.filter((c) => c.children?.length).map((c) => c.id)
  );

  const filteredCodes = codes.filter(
    (c) => !searchCode || c.name.toLowerCase().includes(searchCode.toLowerCase())
  );

  return (
    <>
      {/* Header */}
      <div className="p-3 flex items-center justify-between">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Códigos ({codes.length})
        </span>
        <button
          onClick={onNewCode}
          className="px-2.5 py-1 bg-trama-500 hover:bg-trama-600 text-white text-[11px] font-medium rounded-md flex items-center gap-1 transition"
        >
          <Ic d={ic.plus} className="w-3 h-3" />
          Novo
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-md px-2.5 py-1.5 gap-1.5">
          <Ic d={ic.search} className="w-3 h-3 text-stone-400" />
          <input
            value={searchCode}
            onChange={(e) => setSearchCode(e.target.value)}
            placeholder="Buscar código..."
            className="bg-transparent text-xs flex-1 outline-none"
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-3">
        {filteredCodes.map((code) => (
          <div key={code.id} className="mb-0.5">
            <button
              onClick={() =>
                code.children?.length &&
                setExpandedCodes((s) =>
                  s.includes(code.id) ? s.filter((x) => x !== code.id) : [...s, code.id]
                )
              }
              className="w-full flex items-center gap-2 px-2 py-2 rounded-md hover:bg-stone-50 transition text-left"
            >
              {code.children?.length ? (
                <Ic
                  d={expandedCodes.includes(code.id) ? ic.chevD : ic.chevR}
                  className="w-3 h-3 text-stone-400"
                />
              ) : (
                <span className="w-3" />
              )}
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: code.color }} />
              <span className="text-sm text-stone-700 flex-1">{code.name}</span>
              <span className="text-xs text-stone-400 bg-stone-50 rounded-full px-2 py-0.5">
                {code._count.codings}
              </span>
            </button>

            {code.children?.length && expandedCodes.includes(code.id)
              ? code.children.map((ch) => (
                  <div key={ch.id} className="flex items-center gap-2 pl-9 pr-2 py-1.5">
                    <span className="w-2 h-2 rounded-full opacity-60" style={{ background: ch.color }} />
                    <span className="text-xs text-stone-500 flex-1">{ch.name}</span>
                    <span className="text-[11px] text-stone-400">{ch._count?.codings ?? 0}</span>
                  </div>
                ))
              : null}
          </div>
        ))}
      </div>

      {/* Stats */}
      <div className="border-t border-stone-200 p-3">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider block mb-2.5">
          Estatísticas
        </span>
        {codes.slice(0, 5).map((code) => {
          const max = Math.max(...codes.map((c) => c._count.codings), 1);
          return (
            <div key={code.id} className="mb-2">
              <div className="flex justify-between mb-1">
                <span className="text-[11px] text-stone-500">{code.name}</span>
                <span className="text-[11px] text-stone-400">{code._count.codings}</span>
              </div>
              <div className="bg-stone-100 rounded-sm h-1 overflow-hidden">
                <div
                  className="h-full rounded-sm"
                  style={{
                    width: `${(code._count.codings / max) * 100}%`,
                    background: code.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
