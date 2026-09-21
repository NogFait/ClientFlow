import type { IClient } from "../types"
import type { IProject } from "../../projects/types"
import type { IPayment } from "../../payments/types"

export interface ClientRankRow {
  clientId: string
  name: string
  /** Paid payments dated in `year`, through the client's projects. */
  collected: number
  /** Pending payments, any date — money still owed. */
  pending: number
  projects: number
}

interface RankClientsInput {
  clients: IClient[]
  projects: IProject[]
  payments: IPayment[]
  year: number
}

// "¿Quién te deja más plata?" — Pro. Payments hang off projects, projects
// off clients, so amounts roll up through project.client_id. Pure and
// date-string based: payment_date is a DB `date` ("YYYY-MM-DD"), its year
// is the first four characters — no Date parsing, no timezone shift.
export function rankClients({ clients, projects, payments, year }: RankClientsInput): ClientRankRow[] {
  const clientOfProject = new Map<string, string>()
  for (const p of projects) if (p.id && p.client_id) clientOfProject.set(p.id, p.client_id)

  const rows = new Map<string, ClientRankRow>()
  for (const c of clients) {
    if (!c.id) continue
    rows.set(c.id, { clientId: c.id, name: c.name, collected: 0, pending: 0, projects: 0 })
  }
  for (const [, clientId] of clientOfProject) {
    const row = rows.get(clientId)
    if (row) row.projects += 1
  }

  const yearPrefix = `${year}-`
  for (const pay of payments) {
    const clientId = pay.project_id ? clientOfProject.get(pay.project_id) : undefined
    const row = clientId ? rows.get(clientId) : undefined
    if (!row) continue
    const amount = Number(pay.amount)
    if (pay.status === "pendiente") row.pending += amount
    else if (pay.status === "pagado" && pay.payment_date?.startsWith(yearPrefix)) row.collected += amount
  }

  return [...rows.values()].sort(
    (a, b) => b.collected - a.collected || b.pending - a.pending || a.name.localeCompare(b.name),
  )
}
