import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DashboardClient } from "@/components/DashboardClient";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;

  const projects = await prisma.project.findMany({
    where: {
      OR: [{ ownerId: userId }, { members: { some: { userId } } }],
    },
    include: {
      _count: { select: { documents: true, codes: true } },
      owner: { select: { name: true } },
      documents: { select: { id: true }, take: 1 },
    },
    orderBy: { updatedAt: "desc" },
  });

  const sidebarProjects = projects.map((p) => ({
    id: p.id,
    name: p.name,
    color: p.color,
  }));

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projects={sidebarProjects} />
        <DashboardClient projects={projects as any} />
      </div>
    </div>
  );
}
