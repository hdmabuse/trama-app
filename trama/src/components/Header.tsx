"use client";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useState } from "react";
import { PlanBadge } from "./PlanBadge";

export function Header() {
  const { data: session } = useSession();
  const [showMenu, setShowMenu] = useState(false);
  const user = session?.user as any;
  const initials = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  return (
    <header className="h-14 bg-white border-b border-stone-200 flex items-center px-5 gap-4 shrink-0 z-30">
      <Link href="/dashboard" className="shrink-0">
        <span className="text-xl font-black text-trama-500 tracking-tight">trama</span>
      </Link>
      <div className="flex-1 max-w-md mx-auto">
        <div className="flex items-center bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 gap-2">
          <svg className="w-3.5 h-3.5 text-stone-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <span className="text-xs text-stone-400">Buscar... (⌘K)</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {user?.isAdmin && (
          <Link href="/admin" className="text-xs text-stone-400 hover:text-trama-500 font-medium px-2 py-1 rounded-md hover:bg-stone-50 transition">Admin</Link>
        )}
        {user?.plan && <PlanBadge plan={user.plan} />}
        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)} className="w-8 h-8 rounded-full bg-argila text-white text-xs font-semibold flex items-center justify-center">
            {initials}
          </button>
          {showMenu && (
            <div className="absolute right-0 top-10 bg-white border border-stone-200 rounded-lg shadow-lg py-1 w-52 z-50">
              <div className="px-3 py-2 border-b border-stone-100">
                <p className="text-sm font-medium text-stone-800">{user?.name}</p>
                <p className="text-xs text-stone-400">{user?.email}</p>
              </div>
              <Link href="/constituicao" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50" onClick={() => setShowMenu(false)}>Constituição ética</Link>
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="w-full text-left px-3 py-2 text-sm text-stone-600 hover:bg-stone-50">
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
