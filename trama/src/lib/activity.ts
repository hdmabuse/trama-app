import { prisma } from "./db";

export async function logActivity(
  userId: string,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, any>,
  ip?: string
) {
  try {
    await prisma.activityLog.create({
      data: { userId, action, resource, resourceId, metadata: metadata ? JSON.stringify(metadata) : null, ip },
    });
  } catch (e) {
    console.error("Failed to log activity:", e);
  }
}
