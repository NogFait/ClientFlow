import { describe, expect, it } from "vitest"
import { summarizeProject } from "./projectSummary"
import type { IPayment } from "../../payments/types"
import type { ITask } from "../../tasks/types"

function payment(amount: number, status: IPayment["status"]): IPayment {
  return { amount, status, method: "efectivo" }
}

function task(status: ITask["status"]): ITask {
  return { title: "t", status, priority: "medium" }
}

describe("summarizeProject", () => {
  it("sums paid and pending amounts, counts pending payments", () => {
    const result = summarizeProject({
      budget: 1000,
      payments: [payment(300, "pagado"), payment(200, "pagado"), payment(150, "pendiente")],
      tasks: [],
    })

    expect(result.paid).toBe(500)
    expect(result.pending).toBe(150)
    expect(result.pendingCount).toBe(1)
  })

  it("coerces string amounts (as Supabase can return numeric columns as strings)", () => {
    const result = summarizeProject({
      budget: 1000,
      payments: [{ amount: "300" as unknown as number, status: "pagado", method: "efectivo" }],
      tasks: [],
    })

    expect(result.paid).toBe(300)
  })

  it("computes paidPct against budget, rounded", () => {
    const result = summarizeProject({
      budget: 1000,
      payments: [payment(250, "pagado")],
      tasks: [],
    })

    expect(result.budget).toBe(1000)
    expect(result.paidPct).toBe(25)
    expect(result.rawPct).toBe(25)
  })

  it("returns paidPct=null and rawPct=null when there is no budget", () => {
    const result = summarizeProject({
      budget: null,
      payments: [payment(250, "pagado")],
      tasks: [],
    })

    expect(result.budget).toBeNull()
    expect(result.paidPct).toBeNull()
    expect(result.rawPct).toBeNull()
  })

  it("returns paidPct=null and rawPct=null when budget is zero or negative (triangulation)", () => {
    expect(summarizeProject({ budget: 0, payments: [], tasks: [] }).paidPct).toBeNull()
    expect(summarizeProject({ budget: -100, payments: [], tasks: [] }).paidPct).toBeNull()
  })

  it("caps paidPct at 100 when over-collected but exposes the true rawPct", () => {
    const result = summarizeProject({
      budget: 1000,
      payments: [payment(1500, "pagado")],
      tasks: [],
    })

    expect(result.paidPct).toBe(100)
    expect(result.rawPct).toBe(150)
  })

  it("counts done vs total tasks and computes tasksPct", () => {
    const result = summarizeProject({
      budget: null,
      payments: [],
      tasks: [task("hechas"), task("hechas"), task("pendiente"), task("en_progreso")],
    })

    expect(result.tasksDone).toBe(2)
    expect(result.tasksTotal).toBe(4)
    expect(result.tasksPct).toBe(50)
  })

  it("returns tasksPct=null when there are no tasks (triangulation)", () => {
    const result = summarizeProject({ budget: null, payments: [], tasks: [] })

    expect(result.tasksTotal).toBe(0)
    expect(result.tasksDone).toBe(0)
    expect(result.tasksPct).toBeNull()
  })

  it("handles fully empty input (no budget, no payments, no tasks)", () => {
    const result = summarizeProject({ budget: null, payments: [], tasks: [] })

    expect(result).toEqual({
      budget: null,
      paid: 0,
      pending: 0,
      pendingCount: 0,
      paidPct: null,
      rawPct: null,
      tasksDone: 0,
      tasksTotal: 0,
      tasksPct: null,
    })
  })
})
