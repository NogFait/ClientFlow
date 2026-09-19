// Pure calendar-month helpers for the Payments month selector. Plain
// "YYYY-MM"/"YYYY-MM-DD" strings are used everywhere (instead of Date
// objects) to avoid timezone drift when a range is later handed to a
// Postgres date column via supabase's .gte()/.lt().
import type { Lang } from "../i18n"
import { toLocale } from "../i18n/locale"

export type MonthKey = `${number}-${string}`

const MONTH_KEY_RE = /^(\d{4})-(\d{2})$/

function pad2(n: number): string {
  return String(n).padStart(2, "0")
}

function toKey(year: number, month1to12: number): MonthKey {
  return `${year}-${pad2(month1to12)}` as MonthKey
}

// Splits a MonthKey into { year, month } with month 1-12. Assumes the key
// is already valid (came from currentMonthKey/parseMonthKey/shiftMonth).
function splitKey(key: MonthKey): { year: number; month: number } {
  const [year, month] = key.split("-").map(Number)
  return { year, month }
}

export function currentMonthKey(now: Date = new Date()): MonthKey {
  return toKey(now.getFullYear(), now.getMonth() + 1)
}

export function parseMonthKey(value: string): MonthKey | null {
  const match = MONTH_KEY_RE.exec(value)
  if (!match) return null
  const month = Number(match[2])
  if (month < 1 || month > 12) return null
  return value as MonthKey
}

export function shiftMonth(key: MonthKey, delta: number): MonthKey {
  const { year, month } = splitKey(key)
  const totalMonths = year * 12 + (month - 1) + delta
  const newYear = Math.floor(totalMonths / 12)
  const newMonthIndex = ((totalMonths % 12) + 12) % 12
  return toKey(newYear, newMonthIndex + 1)
}

export function monthRange(key: MonthKey): { from: string; to: string } {
  const { year, month } = splitKey(key)
  const from = `${year}-${pad2(month)}-01`
  const nextKey = shiftMonth(key, 1)
  const { year: nextYear, month: nextMonth } = splitKey(nextKey)
  const to = `${nextYear}-${pad2(nextMonth)}-01`
  return { from, to }
}

export function yearRange(key: MonthKey): { from: string; to: string } {
  const { year } = splitKey(key)
  return { from: `${year}-01-01`, to: `${year + 1}-01-01` }
}

// Month names follow the UI language. Intl gives us "septiembre"/"September"
// for free; the capitalisation is ours because es-AR month names are
// lowercase and the UI has always shown "Septiembre 2026".
const monthNameFormatters: Record<Lang, Intl.DateTimeFormat> = {
  es: new Intl.DateTimeFormat(toLocale("es"), { month: "long" }),
  en: new Intl.DateTimeFormat(toLocale("en"), { month: "long" }),
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`
}

/** 0-based month index → capitalized full name ("Septiembre" / "September"). */
export function monthName(monthIndex: number, lang: Lang): string {
  return capitalize(monthNameFormatters[lang].format(new Date(2000, monthIndex, 1)))
}

/** "2026-09" → "Septiembre 2026" / "September 2026". */
export function formatMonth(key: MonthKey, lang: Lang): string {
  const { year, month } = splitKey(key)
  return `${monthName(month - 1, lang)} ${year}`
}

// Kept for the callers that are Spanish by contract (tests, prerender
// fixtures); the UI goes through formatMonth(key, lang).
export function formatMonthEsAr(key: MonthKey): string {
  return formatMonth(key, "es")
}

export function isFutureMonth(key: MonthKey, now: Date = new Date()): boolean {
  return key > currentMonthKey(now)
}

// Hand-written abbreviations rather than Intl's `month: "short"`: es-AR
// yields "sept" (four letters) and en-US "Sept" in some ICU builds, which
// breaks the three-letter grid in MonthSelector. Spanish stays lowercase
// ("oct") as the payments card has always shown it; English abbreviations
// are conventionally capitalized ("Oct").
const SHORT_MONTHS: Record<Lang, readonly string[]> = {
  es: ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"],
  en: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
}

/** "2026-10" → "oct" / "Oct" (year omitted: callers list months within one year). */
export function shortMonth(key: MonthKey, lang: Lang): string {
  return SHORT_MONTHS[lang][Number(key.slice(5, 7)) - 1] ?? key
}

export function shortMonthEsAr(key: MonthKey): string {
  return shortMonth(key, "es")
}
