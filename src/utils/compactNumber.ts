// Compact axis labels for money charts ("600k", "2,4M"). Hand-rolled instead
// of Intl compact notation so the output is identical in Node, jsdom and every
// browser, and short enough to fit a ~40px y-axis column on a phone.
export function formatCompactNumber(value: number): string {
  const abs = Math.abs(value)
  if (abs < 1000) return String(value)

  const [amount, suffix] = abs >= 1_000_000 ? [value / 1_000_000, "M"] : [value / 1000, "k"]
  const rounded = Math.round(amount * 10) / 10
  const text = Number.isInteger(rounded) ? String(rounded) : String(rounded).replace(".", ",")
  return `${text}${suffix}`
}
