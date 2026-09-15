// Pure calendar-month helpers for the Payments month selector. Plain
// "YYYY-MM"/"YYYY-MM-DD" strings are used everywhere (instead of Date
// objects) to avoid timezone drift when a range is later handed to a
// Postgres date column via supabase's .gte()/.lt().
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

const monthNameFormatter = new Intl.DateTimeFormat("es-AR", { month: "long" })

export function formatMonthEsAr(key: MonthKey): string {
  const { year, month } = splitKey(key)
  const name = monthNameFormatter.format(new Date(year, month - 1, 1))
  return `${name.charAt(0).toUpperCase()}${name.slice(1)} ${year}`
}

export function isFutureMonth(key: MonthKey, now: Date = new Date()): boolean {
  return key > currentMonthKey(now)
}
