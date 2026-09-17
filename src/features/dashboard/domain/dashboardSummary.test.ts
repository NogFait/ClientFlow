import { describe, expect, it } from "vitest"
import { summarizeDashboard } from "./dashboardSummary"
import type { IPayment } from "../../payments/types"
import type { ITask } from "../../tasks/types"

const payment = (over: Partial<IPayment>): IPayment => ({ amount: 0, method: "transferencia", status: "pendiente", ...over })
const task = (over: Partial<ITask>): ITask => ({ title: "t", status: "pendiente", priority: "medium", ...over })

// The dashboard's two questions: "¿cuánto me falta cobrar?" and "¿qué tengo
// que hacer?". `today` is injected as an ISO date so the tests (and SSR, if it
// ever renders this) are deterministic.
describe("summarizeDashboard", () => {
  const today = "2026-09-16"

  it("sums pending payments as receivable and flags the ones past their date as overdue", () => {
    const s = summarizeDashboard(
      [
        payment({ amount: 100, status: "pendiente", payment_date: "2026-09-01" }), // overdue
        payment({ amount: 250, status: "pendiente", payment_date: "2026-10-15" }), // upcoming
        payment({ amount: 999, status: "pagado", payment_date: "2026-09-10" }),    // ignored
        payment({ amount: 40, status: "pendiente" }),                              // no date → receivable, not overdue
      ],
      [],
      today,
    )

    expect(s.receivable).toBe(390)
    expect(s.overdueAmount).toBe(100)
    expect(s.overdueCount).toBe(1)
  })

  it("treats a pending payment dated today as due, not overdue", () => {
    const s = summarizeDashboard([payment({ amount: 10, payment_date: today })], [], today)
    expect(s.overdueAmount).toBe(0)
  })

  it("counts open tasks due today and overdue, ignoring done ones", () => {
    const s = summarizeDashboard(
      [],
      [
        task({ due_date: "2026-09-16" }),                       // today
        task({ due_date: "2026-09-10", status: "en_progreso" }), // overdue
        task({ due_date: "2026-09-01", status: "hechas" }),      // done → ignored
        task({ due_date: "2026-09-30" }),                        // future
        task({}),                                                // no date
      ],
      today,
    )

    expect(s.tasksDueToday).toBe(1)
    expect(s.tasksOverdue).toBe(1)
    expect(s.tasksOpen).toBe(4)
  })

  it("returns zeros for empty input", () => {
    expect(summarizeDashboard([], [], today)).toEqual({
      receivable: 0,
      overdueAmount: 0,
      overdueCount: 0,
      tasksDueToday: 0,
      tasksOverdue: 0,
      tasksOpen: 0,
    })
  })
})
