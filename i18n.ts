import { getRequestConfig } from 'next-intl/server'

export const locales = ['pt', 'en', 'es'] as const
export type Locale = (typeof locales)[number]
export const defaultLocale: Locale = 'pt'

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? 'pt'
  const validLocale = locales.includes(locale as Locale) ? locale : 'pt'

  return {
    locale: validLocale,
    messages: (await import(`./messages/${validLocale}.json`)).default,
    timeZone: 'America/Recife',
  }
})
