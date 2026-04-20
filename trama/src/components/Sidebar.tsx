"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Project = {
  id: string;
  name: string;
  color: string;
};

export function Sidebar({ projects }: { projects: Project[] }) {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-stone-50 border-r border-stone-200 flex flex-col py-4 shrink-0">
      <div className="px-4 mb-2">
        <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
          Projetos
        </span>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        {projects.map((p) => {
          const active = pathname === `/projeto/${p.id}`;
          return (
            <Link
              key={p.id}
              href={`/projeto/${p.id}`}
              className={`flex items-center gap-2.5 px-4 py-2.5 text-sm transition ${
                active
                  ? "bg-orange-50 border-r-[3px] border-argila text-stone-800 font-medium"
                  : "text-stone-500 hover:bg-stone-100 border-r-[3px] border-transparent"
              }`}
            >
              <span
                className="w-2 h-2 rounded-sm shrink-0"
                style={{ background: p.color }}
              />
              <span className="truncate">{p.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-stone-200 pt-3 px-4 space-y-1">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-stone-400 hover:text-stone-600 py-1"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h7v7H3zM14 3h7v7h-7zM14 14h7v7h-7zM3 14h7v7H3z" />
          </svg>
          Todos os projetos
        </Link>
      </div>
    </aside>
  );
}
