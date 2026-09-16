// "2026-09-16" → "16 de septiembre de 2026". A month-name table instead of
// Intl/toLocaleDateString on purpose: the output must be byte-identical when
// rendered by Node at build time (prerender) and by the browser at hydration,
// and locale data differs across runtimes/ICU builds. Parsing by regex (no
// Date object) also sidesteps timezone shifts for date-only values.

const MONTHS_ES = [
  "enero",
  "febrero",
  "marzo",
  "abril",
  "mayo",
  "junio",
  "julio",
  "agosto",
  "septiembre",
  "octubre",
  "noviembre",
  "diciembre",
]

export const ISO_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/

export function formatDateEs(isoDate: string): string {
  const match = ISO_DATE_PATTERN.exec(isoDate)
  if (!match) {
    throw new Error(`formatDateEs: expected YYYY-MM-DD, got ${JSON.stringify(isoDate)}`)
  }

  const [, year, month, day] = match
  const monthName = MONTHS_ES[Number(month) - 1]
  if (!monthName) {
    throw new Error(`formatDateEs: invalid month in ${isoDate}`)
  }

  return `${Number(day)} de ${monthName} de ${year}`
}
