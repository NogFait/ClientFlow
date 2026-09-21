// Pure: what goes in this week's email for one user. Dates are the DB's
// "YYYY-MM-DD" strings and are compared as strings — chronological for
// ISO dates, no timezone parsing anywhere.

export interface DigestPayment {
  amount: number | string
  status: string
  payment_date?: string | null
  proyectos?: { name: string; clientes?: { name: string } | null } | null
}

export interface DigestTask {
  title: string
  status: string
  due_date?: string | null
  proyectos?: { name: string } | null
}

export interface DigestClient {
  id: string
  name: string
  status: string
  created_at: string
}

export interface DigestNote {
  client_id: string
  note_date: string
}

export interface DigestInput {
  /** Local calendar day the digest is built for ("YYYY-MM-DD"). */
  today: string
  payments: DigestPayment[]
  tasks: DigestTask[]
  clients: DigestClient[]
  notes: DigestNote[]
}

export interface DigestPaymentLine {
  amount: number
  date: string
  client: string
  project: string
}

export interface DigestTaskLine {
  title: string
  date: string
  project: string
}

export interface WeeklyDigest {
  paymentsDue: DigestPaymentLine[]
  paymentsDueTotal: number
  overdue: DigestPaymentLine[]
  overdueTotal: number
  tasksDue: DigestTaskLine[]
  staleClients: { name: string; daysSinceContact: number }[]
}

const STALE_AFTER_DAYS = 30
const MAX_STALE_CLIENTS = 5

function addDays(dateOnly: string, days: number): string {
  const [y, m, d] = dateOnly.split("-").map(Number)
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

function daysBetween(fromDateOnly: string, toDateOnly: string): number {
  const [y1, m1, d1] = fromDateOnly.split("-").map(Number)
  const [y2, m2, d2] = toDateOnly.split("-").map(Number)
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000)
}

/** [today, today + 7 days) */
export function weekWindow(today: string): { from: string; to: string } {
  return { from: today, to: addDays(today, 7) }
}

function paymentLine(p: DigestPayment): DigestPaymentLine {
  return {
    amount: Number(p.amount),
    date: p.payment_date ?? "",
    client: p.proyectos?.clientes?.name ?? "",
    project: p.proyectos?.name ?? "",
  }
}

export function buildWeeklyDigest({ today, payments, tasks, clients, notes }: DigestInput): WeeklyDigest | null {
  const { from, to } = weekWindow(today)
  const byDate = <T extends { date: string }>(a: T, b: T) => a.date.localeCompare(b.date)

  const pending = payments.filter((p) => p.status === "pendiente" && p.payment_date)
  const paymentsDue = pending.filter((p) => p.payment_date! >= from && p.payment_date! < to).map(paymentLine).sort(byDate)
  const overdue = pending.filter((p) => p.payment_date! < from).map(paymentLine).sort(byDate)

  const tasksDue = tasks
    .filter((t) => t.status !== "hechas" && t.due_date && t.due_date >= from && t.due_date < to)
    .map((t) => ({ title: t.title, date: t.due_date!, project: t.proyectos?.name ?? "" }))
    .sort(byDate)

  // Last contact = newest note; with no notes, the day the client was created.
  const lastNote = new Map<string, string>()
  for (const n of notes) {
    const current = lastNote.get(n.client_id)
    if (!current || n.note_date > current) lastNote.set(n.client_id, n.note_date)
  }
  const staleClients = clients
    .filter((c) => c.status === "activo")
    .map((c) => ({ name: c.name, daysSinceContact: daysBetween(lastNote.get(c.id) ?? c.created_at.slice(0, 10), today) }))
    .filter((c) => c.daysSinceContact >= STALE_AFTER_DAYS)
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact)
    .slice(0, MAX_STALE_CLIENTS)

  if (paymentsDue.length === 0 && overdue.length === 0 && tasksDue.length === 0 && staleClients.length === 0) return null

  const sum = (lines: DigestPaymentLine[]) => lines.reduce((acc, l) => acc + l.amount, 0)
  return {
    paymentsDue,
    paymentsDueTotal: sum(paymentsDue),
    overdue,
    overdueTotal: sum(overdue),
    tasksDue,
    staleClients,
  }
}
