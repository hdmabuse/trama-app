import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect, notFound } from "next/navigation";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { Workspace } from "@/components/Workspace";

export default async function ProjetoPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const userId = (session.user as any).id;

  const project = await prisma.project.findUnique({
    where: { id: params.id },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { codings: true } } },
      },
      codes: {
        where: { parentId: null },
        include: {
          children: { include: { _count: { select: { codings: true } } } },
          _count: { select: { codings: true } },
        },
        orderBy: { name: "asc" },
      },
      themes: {
        orderBy: { sortOrder: "asc" },
        include: {
          themeCodes: {
            include: { code: { select: { id: true, name: true, color: true } } },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const allProjects = await prisma.project.findMany({
    where: { OR: [{ ownerId: userId }, { members: { some: { userId } } }] },
    select: { id: true, name: true, color: true },
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="h-screen flex flex-col bg-stone-50">
      <Header />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar projects={allProjects} />
        <Workspace project={project as any} userId={userId} />
      </div>
    </div>
  );
}
