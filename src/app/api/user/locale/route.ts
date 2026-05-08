// src/app/api/user/locale/route.ts
//
// PATCH /api/user/locale — salvar preferência de idioma no perfil do usuário
// Chamado pelo LocaleSwitcher quando saveToDb=true (usuária logada)

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

const VALID_LOCALES = ['pt', 'en', 'es'] as const
type ValidLocale = typeof VALID_LOCALES[number]

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const userId = (session.user as any).id

  let body: { locale?: unknown }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Body inválido' }, { status: 400 })
  }

  const locale = body.locale

  if (!locale || !VALID_LOCALES.includes(locale as ValidLocale)) {
    return NextResponse.json(
      { error: `Locale inválido. Use: ${VALID_LOCALES.join(', ')}` },
      { status: 400 }
    )
  }

  await prisma.user.update({
    where: { id: userId },
    data: { locale: locale as string },
  })

  return NextResponse.json({ ok: true, locale })
}
