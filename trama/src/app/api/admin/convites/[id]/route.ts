import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!(session?.user as any)?.isAdmin) return NextResponse.json({ error: "Acesso negado" }, { status: 403 });

  const body = await req.json();

  if (body.action === "cancel") {
    await prisma.adminInvite.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  } else if (body.action === "resend") {
    await prisma.adminInvite.update({
      where: { id: params.id },
      data: { status: "PENDING", token: require("crypto").randomUUID(), expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
    });
  } else if (body.plan) {
    const invite = await prisma.adminInvite.findUnique({ where: { id: params.id } });
    if (invite?.status !== "PENDING") return NextResponse.json({ error: "Só é possível alterar convites pendentes" }, { status: 400 });
    await prisma.adminInvite.update({ where: { id: params.id }, data: { plan: body.plan } });
  }

  const updated = await prisma.adminInvite.findUnique({ where: { id: params.id } });
  return NextResponse.json(updated);
}
