export type Currency = "ARS" | "USD"

const formatters: Record<Currency, Intl.NumberFormat> = {
  ARS: new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }),
  USD: new Intl.NumberFormat("es-AR", { style: "currency", currency: "USD", minimumFractionDigits: 2 }),
}

// Single source of truth for rendering money in the UI (es-AR grouping/decimal
// separators: "$ 1.500.000,00", "US$ 120,00"). Per-project currency
// (ARS/USD) is deferred — see engram topic ux/batch-1-empty-states-toasts-currency
// — so every call site defaults to ARS today.
export function formatCurrency(amount: number, currency: Currency = "ARS"): string {
  return formatters[currency].format(amount)
}
