import { describe, expect, it } from "vitest"
import { rankClients } from "./clientRanking"
import type { IClient } from "../types"
import type { IProject } from "../../projects/types"
import type { IPayment } from "../../payments/types"

const client = (id: string, name: string): IClient => ({ id, name, email: "", celular: "", company: "", status: "activo" })
const project = (id: string, client_id: string): IProject => ({ id, client_id, name: `P${id}`, status: "activo" })
const payment = (project_id: string, amount: number, status: IPayment["status"], payment_date?: string): IPayment => ({
  project_id, amount, status, method: "transferencia", payment_date,
})

describe("rankClients", () => {
  it("sums what each client paid this year and what they still owe, through their projects, best payer first", () => {
    const rows = rankClients({
      clients: [client("c1", "Tita"), client("c2", "Pepe")],
      projects: [project("p1", "c1"), project("p2", "c1"), project("p3", "c2")],
      payments: [
        payment("p1", 100000, "pagado", "2026-03-10"),
        payment("p2", 50000, "pagado", "2026-08-01"),
        payment("p2", 30000, "pendiente", "2026-10-15"),
        payment("p3", 200000, "pagado", "2026-05-05"),
      ],
      year: 2026,
    })

    expect(rows).toEqual([
      { clientId: "c2", name: "Pepe", collected: 200000, pending: 0, projects: 1 },
      { clientId: "c1", name: "Tita", collected: 150000, pending: 30000, projects: 2 },
    ])
  })

  it("only counts payments dated in the given year as collected; pending is owed regardless of date", () => {
    const rows = rankClients({
      clients: [client("c1", "Tita")],
      projects: [project("p1", "c1")],
      payments: [
        payment("p1", 999, "pagado", "2025-12-31"),
        payment("p1", 1, "pagado", "2026-01-01"),
        payment("p1", 500, "pendiente", "2025-11-01"),
        payment("p1", 700, "pendiente"),
      ],
      year: 2026,
    })

    expect(rows[0]).toMatchObject({ collected: 1, pending: 1200 })
  })

  it("keeps clients with no projects or payments at the bottom with zeros, and ignores payments of unknown projects", () => {
    const rows = rankClients({
      clients: [client("c1", "Sin nada"), client("c2", "Con algo")],
      projects: [project("p2", "c2")],
      payments: [payment("p2", 10, "pagado", "2026-02-02"), payment("ghost", 999, "pagado", "2026-02-02")],
      year: 2026,
    })

    expect(rows.map((r) => r.name)).toEqual(["Con algo", "Sin nada"])
    expect(rows[1]).toMatchObject({ collected: 0, pending: 0, projects: 0 })
  })

  it("breaks ties on collected by pending (more owed = more relevant), then by name", () => {
    const rows = rankClients({
      clients: [client("c1", "Zeta"), client("c2", "Alfa"), client("c3", "Beta")],
      projects: [project("p1", "c1"), project("p2", "c2"), project("p3", "c3")],
      payments: [payment("p3", 50, "pendiente")],
      year: 2026,
    })

    expect(rows.map((r) => r.name)).toEqual(["Beta", "Alfa", "Zeta"])
  })
})
