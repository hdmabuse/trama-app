// src/app/[locale]/layout.tsx
// Substituir o src/app/layout.tsx existente por este arquivo
// (mover src/app/layout.tsx para src/app/[locale]/layout.tsx)

import type { Metadata } from 'next'
import '../globals.css'
import { Inter } from 'next/font/google'
import { NextIntlClientProvider } from 'next-intl'
import { getMessages } from 'next-intl/server'
import { notFound } from 'next/navigation'
import { locales, type Locale } from '../../../i18n'

// Manter os imports que já existem no layout atual (Providers, etc.)
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export function generateStaticParams() {
  return locales.map(locale => ({ locale }))
}

export const metadata: Metadata = {
  title: {
    default: 'TRAMA',
    template: '%s — TRAMA',
  },
  description: 'Análise qualitativa reflexiva. Sem IA. Seus dados ficam com você.',
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode
  params: { locale: string }
}) {
  // Retornar 404 se locale inválido
  if (!locales.includes(locale as Locale)) {
    notFound()
  }

  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider messages={messages} locale={locale}>
          <Providers>
            {children}
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
