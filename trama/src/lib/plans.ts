import { prisma } from "./db";

export const PLAN_LIMITS = {
  FREE: { projects: 3, docsPerProject: 20, membersPerProject: 1, storageMB: 500, exports: ["md"] },
  PRO: { projects: 20, docsPerProject: 100, membersPerProject: 5, storageMB: 5120, exports: ["pdf", "md", "json", "csv"] },
  TEAM: { projects: Infinity, docsPerProject: 500, membersPerProject: 20, storageMB: 20480, exports: ["pdf", "md", "json", "csv"] },
} as const;

export type PlanType = keyof typeof PLAN_LIMITS;

export const PLAN_LABELS: Record<PlanType, string> = { FREE: "Free", PRO: "Pro", TEAM: "Team" };
export const PLAN_PRICES: Record<PlanType, string> = { FREE: "R$ 0", PRO: "R$ 39/mês", TEAM: "R$ 99/mês" };
export const PLAN_COLORS: Record<PlanType, string> = { FREE: "#94a3b8", PRO: "#6366f1", TEAM: "#C97B5D" };

export async function checkPlanLimit(
  userId: string,
  resource: "projects" | "documents" | "members",
  projectId?: string
): Promise<{ allowed: boolean; current: number; limit: number; plan: PlanType }> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { plan: true } });
  const plan = (user?.plan || "FREE") as PlanType;
  const limits = PLAN_LIMITS[plan];

  let current = 0;
  let limit = 0;

  switch (resource) {
    case "projects":
      current = await prisma.project.count({ where: { ownerId: userId } });
      limit = limits.projects;
      break;
    case "documents":
      if (!projectId) return { allowed: false, current: 0, limit: 0, plan };
      current = await prisma.document.count({ where: { projectId } });
      limit = limits.docsPerProject;
      break;
    case "members":
      if (!projectId) return { allowed: false, current: 0, limit: 0, plan };
      current = await prisma.projectMember.count({ where: { projectId } });
      limit = limits.membersPerProject;
      break;
  }

  return { allowed: current < limit, current, limit, plan };
}

export function canExport(plan: PlanType, format: string): boolean {
  return PLAN_LIMITS[plan].exports.includes(format);
}
