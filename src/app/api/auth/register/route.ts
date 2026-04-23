import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const { name, email, password } = body;

  if (!name || !email || !password) return NextResponse.json({ error: "Nome, email e senha obrigatórios" }, { status: 400 });
  if (password.length < 8) return NextResponse.json({ error: "Senha deve ter no mínimo 8 caracteres" }, { status: 400 });
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    return NextResponse.json({ error: "Senha deve ter maiúscula, minúscula e número" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Já existe uma conta com este email" }, { status: 409 });

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, plan: "FREE", isActive: true },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
