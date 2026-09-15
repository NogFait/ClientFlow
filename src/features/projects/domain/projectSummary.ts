import type { IPayment } from "../../payments/types"
import type { ITask } from "../../tasks/types"

export interface ProjectSummaryInput {
  budget?: number | null
  payments: IPayment[]
  tasks: ITask[]
}

export interface ProjectSummary {
  budget: number | null
  paid: number
  pending: number
  pendingCount: number
  // Percentage of budget collected, capped at 100 — safe to feed straight
  // into a progress bar's width.
  paidPct: number | null
  // Same percentage, uncapped — an over-collected project (paid > budget)
  // shows 100 on the bar but the true number (e.g. 150) wherever it's
  // displayed as text.
  rawPct: number | null
  tasksDone: number
  tasksTotal: number
  tasksPct: number | null
}

// Pure aggregation of a project's payments/tasks into the numbers the hub's
// StatCards and progress bars render. Amounts arrive from Supabase as
// strings or numbers depending on the column/driver, so every amount is
// coerced with Number() before summing.
export function summarizeProject({ budget, payments, tasks }: ProjectSummaryInput): ProjectSummary {
  let paid = 0
  let pending = 0
  let pendingCount = 0

  for (const payment of payments) {
    const amount = Number(payment.amount)
    if (payment.status === "pagado") {
      paid += amount
    } else if (payment.status === "pendiente") {
      pending += amount
      pendingCount += 1
    }
  }

  const hasBudget = budget != null && budget > 0
  const rawPct = hasBudget ? Math.round((paid / budget!) * 100) : null
  const paidPct = rawPct === null ? null : Math.min(100, rawPct)

  const tasksTotal = tasks.length
  const tasksDone = tasks.filter((t) => t.status === "hechas").length
  const tasksPct = tasksTotal === 0 ? null : Math.round((tasksDone / tasksTotal) * 100)

  return {
    budget: budget ?? null,
    paid,
    pending,
    pendingCount,
    paidPct,
    rawPct,
    tasksDone,
    tasksTotal,
    tasksPct,
  }
}
