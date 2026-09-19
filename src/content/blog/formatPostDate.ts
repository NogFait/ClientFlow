import type { Lang } from "../../i18n"
import { formatDateEs } from "./formatDateEs"

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
]

// Post dates follow the reader's language (it's formatting, not content):
// "17 de septiembre de 2026" / "September 17, 2026". Hand-rolled like
// formatDateEs so the prerendered HTML and every browser produce the same
// string.
export function formatPostDate(isoDate: string, lang: Lang): string {
  if (lang === "es") return formatDateEs(isoDate)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(isoDate)
  if (!match) throw new Error(`formatPostDate: expected YYYY-MM-DD, got ${JSON.stringify(isoDate)}`)
  const [, year, month, day] = match
  const monthName = MONTHS_EN[Number(month) - 1]
  if (!monthName) throw new Error(`formatPostDate: invalid month in ${isoDate}`)
  return `${monthName} ${Number(day)}, ${year}`
}
