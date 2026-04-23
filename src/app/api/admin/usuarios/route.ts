import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: {
      id: true, name: true, email: true, plan: true, isAdmin: true, isActive: true,
      lastLoginAt: true, createdAt: true,
      _count: { select: { ownedProjects: true, codings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const stats = {
    total: users.length,
    byPlan: { FREE: users.filter(u => u.plan === "FREE").length, PRO: users.filter(u => u.plan === "PRO").length, TEAM: users.filter(u => u.plan === "TEAM").length },
    active: users.filter(u => u.isActive).length,
  };

  return NextResponse.json({ users, stats });
}
