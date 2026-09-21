import { describe, expect, it } from "vitest"
import { buildWeeklyDigest, weekWindow } from "./buildDigest.js"

const today = "2026-09-21" // a Monday

describe("weekWindow", () => {
  it("covers today through the next seven days, end exclusive", () => {
    expect(weekWindow("2026-09-21")).toEqual({ from: "2026-09-21", to: "2026-09-28" })
    expect(weekWindow("2026-12-29")).toEqual({ from: "2026-12-29", to: "2027-01-05" })
  })
})

describe("buildWeeklyDigest", () => {
  it("collects payments due this week, overdue payments, tasks due this week and clients without contact for 30+ days", () => {
    const digest = buildWeeklyDigest({
      today,
      payments: [
        { amount: 100000, status: "pendiente", payment_date: "2026-09-23", proyectos: { name: "Web", clientes: { name: "Tita" } } },
        { amount: 50000, status: "pendiente", payment_date: "2026-09-10", proyectos: { name: "Logo", clientes: { name: "Pepe" } } },
        { amount: 999, status: "pagado", payment_date: "2026-09-22", proyectos: null },
        { amount: 777, status: "pendiente", payment_date: "2026-10-30", proyectos: null },
      ],
      tasks: [
        { title: "Entregar logo", status: "pendiente", due_date: "2026-09-24", proyectos: { name: "Logo" } },
        { title: "Ya hecha", status: "hechas", due_date: "2026-09-24", proyectos: null },
        { title: "Lejos", status: "pendiente", due_date: "2026-11-01", proyectos: null },
      ],
      clients: [
        { id: "c1", name: "Tita", status: "activo", created_at: "2026-01-01T00:00:00Z" },
        { id: "c2", name: "Pepe", status: "activo", created_at: "2026-01-01T00:00:00Z" },
        { id: "c3", name: "Nuevo", status: "activo", created_at: "2026-09-15T00:00:00Z" },
        { id: "c4", name: "Inactivo", status: "inactivo", created_at: "2026-01-01T00:00:00Z" },
      ],
      notes: [
        { client_id: "c1", note_date: "2026-09-15" },
        { client_id: "c2", note_date: "2026-07-01" },
      ],
    })

    expect(digest).toEqual({
      paymentsDue: [{ amount: 100000, date: "2026-09-23", client: "Tita", project: "Web" }],
      paymentsDueTotal: 100000,
      overdue: [{ amount: 50000, date: "2026-09-10", client: "Pepe", project: "Logo" }],
      overdueTotal: 50000,
      tasksDue: [{ title: "Entregar logo", date: "2026-09-24", project: "Logo" }],
      staleClients: [{ name: "Pepe", daysSinceContact: 82 }],
    })
  })

  it("counts a client with no notes at all as stale from their creation date, and skips inactive ones", () => {
    const digest = buildWeeklyDigest({
      today,
      payments: [],
      tasks: [],
      clients: [
        { id: "c1", name: "Silencio", status: "activo", created_at: "2026-06-01T12:00:00Z" },
        { id: "c2", name: "Dormido", status: "inactivo", created_at: "2026-01-01T00:00:00Z" },
      ],
      notes: [],
    })

    expect(digest?.staleClients).toEqual([{ name: "Silencio", daysSinceContact: 112 }])
  })

  it("returns null when there is nothing to say — no email is better than an empty one", () => {
    expect(buildWeeklyDigest({ today, payments: [], tasks: [], clients: [], notes: [] })).toBeNull()
    expect(
      buildWeeklyDigest({
        today,
        payments: [{ amount: 1, status: "pagado", payment_date: "2026-09-22", proyectos: null }],
        tasks: [],
        clients: [{ id: "c", name: "Fresco", status: "activo", created_at: "2026-09-20T00:00:00Z" }],
        notes: [],
      }),
    ).toBeNull()
  })

  it("orders by date and caps stale clients to the five longest-silent", () => {
    const clients = Array.from({ length: 7 }, (_, i) => ({
      id: `c${i}`, name: `C${i}`, status: "activo", created_at: "2026-01-01T00:00:00Z",
    }))
    const notes = clients.map((c, i) => ({ client_id: c.id, note_date: `2026-0${1 + (i % 3)}-10` }))
    const digest = buildWeeklyDigest({
      today,
      payments: [
        { amount: 1, status: "pendiente", payment_date: "2026-09-27", proyectos: null },
        { amount: 2, status: "pendiente", payment_date: "2026-09-21", proyectos: null },
      ],
      tasks: [],
      clients,
      notes,
    })

    expect(digest?.paymentsDue.map((p) => p.date)).toEqual(["2026-09-21", "2026-09-27"])
    expect(digest?.staleClients).toHaveLength(5)
    expect(digest?.staleClients[0].daysSinceContact).toBeGreaterThanOrEqual(digest!.staleClients[4].daysSinceContact)
  })
})
