import type { Lang } from "./index"

// Intl locale tag per UI language. Dates follow the UI language (an English
// UI showing "19/9/2026" reads as a bug to an English speaker); currency
// deliberately does NOT — see utils/currency.ts, amounts are ARS either way.
const LOCALES: Record<Lang, string> = { es: "es-AR", en: "en-US" }

export function toLocale(lang: Lang): string {
  return LOCALES[lang]
}

// Thin wrapper over toLocaleDateString so call sites never pick a locale
// tag by hand. `value` is whatever the DB hands back (ISO date or
// timestamp); an invalid value yields "Invalid Date" — same as before.
export function formatDate(
  value: string | number | Date,
  lang: Lang,
  options?: Intl.DateTimeFormatOptions,
): string {
  return new Date(value).toLocaleDateString(toLocale(lang), options)
}

export function formatDateTime(value: string | number | Date, lang: Lang): string {
  return new Date(value).toLocaleString(toLocale(lang))
}
