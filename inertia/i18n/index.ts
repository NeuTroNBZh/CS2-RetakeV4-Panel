import en from './en.js'
import fr from './fr.js'

export type Locale = 'en' | 'fr'

export const messages: Record<Locale, Record<string, string>> = { en, fr }

export function translate(
  locale: Locale,
  key: string,
  params: Record<string, string | number> = {}
): string {
  const template = messages[locale][key] ?? key
  return template.replace(/\{(\w+)\}/g, (match, name: string) =>
    name in params ? String(params[name]) : match
  )
}
