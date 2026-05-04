import { NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema, parseBody } from "@/lib/validations";

export async function POST(req: Request) {
  const body = await req.json();
  const parsed = parseBody(registerSchema, body);
  if ("error" in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return NextResponse.json({ error: "Já existe uma conta com este email" }, { status: 409 });

  const passwordHash = await hash(password, 12);
  const user = await prisma.user.create({
    data: { name, email, passwordHash, plan: "FREE", isActive: true },
  });

  return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
}
