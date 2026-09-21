import type { Lang } from "../../../i18n"
import type { PaymentMethod, PaymentStatus } from "../types"
import type { MonthKey } from "../../../utils/month"

// One payment flattened for the spreadsheet: names instead of ids, no
// internal fields. Built by the page from the joined query.
export interface CsvPaymentRow {
  payment_date?: string
  client?: string
  project?: string
  amount: number
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
}

export interface CsvLabels {
  header: [string, string, string, string, string, string, string]
  method: Record<PaymentMethod, string>
  status: Record<PaymentStatus, string>
}

interface BuildOptions {
  lang: Lang
  labels: CsvLabels
}

// Excel follows the OS locale: es-AR expects ';' between cells and ',' as
// the decimal mark, en-US the opposite. Picking by UI language means the
// file opens with columns and numbers intact for the contador on the
// other end. The BOM makes Excel decode UTF-8 (accents, ñ) on Windows.
export function buildPaymentsCsv(rows: CsvPaymentRow[], { lang, labels }: BuildOptions): string {
  const separator = lang === "es" ? ";" : ","
  const decimal = lang === "es" ? "," : "."

  // Quote only when needed: the active separator, quotes or line breaks.
  // A decimal comma in es mode is plain content, not a separator.
  const needsQuotes = new RegExp(`["${separator}\\n\\r]`)
  const escape = (value: string) =>
    needsQuotes.test(value) ? `"${value.replace(/"/g, '""')}"` : value
  const number = (n: number) => String(n).replace(".", decimal)

  const lines = [
    labels.header.map(escape).join(separator),
    ...rows.map((r) =>
      [
        r.payment_date ?? "",
        r.client ?? "",
        r.project ?? "",
        number(r.amount),
        labels.method[r.method] ?? r.method,
        labels.status[r.status] ?? r.status,
        r.notes ?? "",
      ]
        .map(escape)
        .join(separator),
    ),
  ]
  return "﻿" + lines.join("\r\n")
}

export function csvFilename(scope: "month" | "year", month: MonthKey): string {
  return scope === "month" ? `clientflow-pagos-${month}.csv` : `clientflow-pagos-${month.slice(0, 4)}.csv`
}
