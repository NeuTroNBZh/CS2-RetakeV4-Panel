export type Locale = 'en' | 'fr'

export const LOCALES: readonly Locale[] = ['en', 'fr']
export const LOCALE_COOKIE = 'panel_locale'

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (LOCALES as readonly string[]).includes(value)
}

export function resolveLocale(
  cookie: unknown,
  acceptLanguage: string | undefined,
  fallback: Locale
): Locale {
  if (isLocale(cookie)) return cookie
  const preferred = (acceptLanguage ?? '')
    .split(',')
    .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase())
    .find(isLocale)
  return preferred ?? fallback
}
