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

// DB `date` columns arrive as "YYYY-MM-DD". `new Date("2026-09-19")` parses
// that as UTC midnight, which in Argentina (UTC-3) is still the 18th — so
// formatDate() would show the previous day. Build a LOCAL midnight instead:
// the calendar day the user typed is the calendar day they see.
export function parseDateOnly(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function formatDateOnly(value: string, lang: Lang, options?: Intl.DateTimeFormatOptions): string {
  return parseDateOnly(value).toLocaleDateString(toLocale(lang), options)
}

// Today as "YYYY-MM-DD" in the user's local calendar — the value a <input
// type="date"> and a DB `date` column expect. toISOString() would give the
// UTC day, which after 21:00 in Argentina is already tomorrow.
export function todayDateOnly(now: Date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0")
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`
}
