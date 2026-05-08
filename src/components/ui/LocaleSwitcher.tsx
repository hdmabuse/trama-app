'use client'

// src/components/ui/LocaleSwitcher.tsx
//
// Seletor de idioma. Usado em:
//   - Landing: canto superior direito, antes do botão "Começar"
//   - Login / Cadastro: canto superior direito
//   - Dashboard: menu do usuário (avatar dropdown)

import { useLocale, useTranslations } from 'next-intl'
import { useRouter, usePathname } from 'next/navigation'
import { useTransition } from 'react'

const LOCALES = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
  { code: 'es', label: 'ES' },
] as const

type LocaleCode = typeof LOCALES[number]['code']

interface LocaleSwitcherProps {
  /** Variante visual */
  variant?: 'light' | 'dark'
  /** Salvar preferência no banco (só quando logada) */
  saveToDb?: boolean
}

export function LocaleSwitcher({ variant = 'light', saveToDb = false }: LocaleSwitcherProps) {
  const t = useTranslations('locale_switcher')
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const [isPending, startTransition] = useTransition()

  async function switchLocale(newLocale: LocaleCode) {
    if (newLocale === locale) return

    // 1. Salvar em cookie (persiste entre sessões, 1 ano)
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=Lax`

    // 2. Salvar no banco (quando logada)
    if (saveToDb) {
      fetch('/api/user/locale', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ locale: newLocale }),
      }).catch(() => {}) // silencioso — não bloquear a troca
    }

    // 3. Navegar para a mesma página no novo idioma
    startTransition(() => {
      // Remover prefixo do locale atual e adicionar o novo
      let newPath = pathname

      // Remover prefixo de locale existente se houver
      for (const loc of LOCALES) {
        if (pathname.startsWith(`/${loc.code}/`)) {
          newPath = pathname.slice(loc.code.length + 1) // remove /en
          break
        }
        if (pathname === `/${loc.code}`) {
          newPath = '/'
          break
        }
      }

      // Adicionar novo prefixo (exceto PT que não tem prefixo)
      if (newLocale !== 'pt') {
        newPath = `/${newLocale}${newPath === '/' ? '' : newPath}`
      }

      router.push(newPath || '/')
      router.refresh()
    })
  }

  const activeClass = variant === 'dark'
    ? 'text-white font-semibold'
    : 'text-trama-600 font-semibold'

  const inactiveClass = variant === 'dark'
    ? 'text-white/50 hover:text-white/80'
    : 'text-stone-400 hover:text-stone-600'

  return (
    <nav
      aria-label={t('label')}
      className={`flex items-center gap-0.5 ${isPending ? 'opacity-60 pointer-events-none' : ''}`}
    >
      {LOCALES.map((loc, i) => (
        <span key={loc.code} className="flex items-center">
          <button
            onClick={() => switchLocale(loc.code)}
            className={`
              text-xs px-1.5 py-1 rounded transition-colors duration-150
              ${locale === loc.code ? activeClass : inactiveClass}
            `}
            aria-label={t(loc.code as 'pt' | 'en' | 'es')}
            aria-current={locale === loc.code ? 'true' : undefined}
            disabled={locale === loc.code}
          >
            {loc.label}
          </button>
          {i < LOCALES.length - 1 && (
            <span className={`text-[10px] ${variant === 'dark' ? 'text-white/20' : 'text-stone-200'}`}>
              /
            </span>
          )}
        </span>
      ))}
    </nav>
  )
}
