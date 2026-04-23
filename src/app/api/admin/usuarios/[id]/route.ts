import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { logActivity } from "@/lib/activity";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const adminId = (session?.user as any)?.id;
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();
  const data: any = {};
  if (body.plan) data.plan = body.plan;
  if (body.isActive !== undefined) data.isActive = body.isActive;

  const user = await prisma.user.update({ where: { id: params.id }, data });
  await logActivity(adminId, body.plan ? "plan_changed" : "user_status_changed", "User", params.id, body);
  return NextResponse.json({ id: user.id, plan: user.plan, isActive: user.isActive });
}
