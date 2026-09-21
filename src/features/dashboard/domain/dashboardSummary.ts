import type { IPayment } from "../../payments/types"
import type { ITask } from "../../tasks/types"
import { todayDateOnly } from "../../../i18n/locale"

export interface DashboardSummary {
  /** Sum of every pending payment, dated or not. */
  receivable: number
  /** Portion of `receivable` whose payment_date is already past. */
  overdueAmount: number
  overdueCount: number
  tasksDueToday: number
  tasksOverdue: number
  /** Tasks not marked "hechas". */
  tasksOpen: number
}

// Dates arrive as "YYYY-MM-DD" strings from Postgres `date` columns, so a
// plain string comparison IS a chronological comparison — no Date parsing,
// no timezone surprises (a `new Date("2026-09-16")` is UTC midnight and can
// read as the 15th in Argentina).
export function summarizeDashboard(payments: IPayment[], tasks: ITask[], today: string): DashboardSummary {
  let receivable = 0
  let overdueAmount = 0
  let overdueCount = 0
  for (const p of payments) {
    if (p.status !== "pendiente") continue
    const amount = Number(p.amount)
    receivable += amount
    if (p.payment_date && p.payment_date < today) {
      overdueAmount += amount
      overdueCount += 1
    }
  }

  let tasksDueToday = 0
  let tasksOverdue = 0
  let tasksOpen = 0
  for (const t of tasks) {
    if (t.status === "hechas") continue
    tasksOpen += 1
    if (!t.due_date) continue
    if (t.due_date === today) tasksDueToday += 1
    else if (t.due_date < today) tasksOverdue += 1
  }

  return { receivable, overdueAmount, overdueCount, tasksDueToday, tasksOverdue, tasksOpen }
}

// Local calendar date as "YYYY-MM-DD" (what the DB stores), not the UTC one
// `toISOString()` would give — at 22:00 in Mendoza the UTC date is tomorrow.
// Same helper the rest of the app uses; kept exported under this name.
export const localIsoDate = todayDateOnly
