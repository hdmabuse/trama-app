import { prisma } from "@/lib/db";

export default async function AdminPage() {
  const [userCount, projectCount, docCount, codingCount, inviteCount] = await Promise.all([
    prisma.user.count(),
    prisma.project.count(),
    prisma.document.count(),
    prisma.coding.count(),
    prisma.adminInvite.count({ where: { status: "PENDING" } }),
  ]);

  const byPlan = await prisma.user.groupBy({ by: ["plan"], _count: true });
  const planCounts: Record<string, number> = { FREE: 0, PRO: 0, TEAM: 0 };
  byPlan.forEach(p => { planCounts[p.plan] = p._count; });

  const cards = [
    { label: "Usuários", value: userCount, color: "#6366f1" },
    { label: "Projetos", value: projectCount, color: "#10b981" },
    { label: "Documentos", value: docCount, color: "#f59e0b" },
    { label: "Codificações", value: codingCount, color: "#ec4899" },
    { label: "Convites pendentes", value: inviteCount, color: "#C97B5D" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-stone-800 mb-6">Painel administrativo</h1>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {cards.map(c => (
          <div key={c.label} className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 mb-1">{c.label}</p>
            <p className="text-2xl font-semibold" style={{ color: c.color }}>{c.value}</p>
          </div>
        ))}
      </div>
      <h2 className="text-lg font-semibold text-stone-800 mb-4">Distribuição por plano</h2>
      <div className="grid grid-cols-3 gap-4">
        {Object.entries(planCounts).map(([plan, count]) => (
          <div key={plan} className="bg-white rounded-xl border border-stone-200 p-5">
            <p className="text-xs text-stone-400 mb-1">{plan}</p>
            <p className="text-3xl font-semibold text-stone-800">{count}</p>
            <p className="text-xs text-stone-400 mt-1">{userCount > 0 ? Math.round((count / userCount) * 100) : 0}% do total</p>
          </div>
        ))}
      </div>
    </div>
  );
}
