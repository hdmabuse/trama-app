import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) redirect("/dashboard");

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-56 bg-white border-r border-stone-200 py-6 px-4 shrink-0">
          <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Administração</span>
          <nav className="mt-4 space-y-1">
            <Link href="/admin" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg">Visão geral</Link>
            <Link href="/admin/convites" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg">Convites</Link>
            <Link href="/admin/usuarios" className="block px-3 py-2 text-sm text-stone-600 hover:bg-stone-50 rounded-lg">Usuários</Link>
          </nav>
          <div className="mt-8 pt-4 border-t border-stone-100">
            <Link href="/dashboard" className="block px-3 py-2 text-sm text-stone-400 hover:text-stone-600 rounded-lg">← Voltar ao dashboard</Link>
          </div>
        </aside>
        <main className="flex-1 overflow-y-auto p-8">{children}</main>
      </div>
    </div>
  );
}
