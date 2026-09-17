import { supabase } from "../../services/supabaseClient"
import type { IPayment } from "./types"

export async function getPayments() {
  const { data, error } = await supabase
    .from("pagos")
    .select(`*, proyectos (name, clientes (name))`)
    .order("payment_date", { ascending: true })
  if (error) throw new Error(error.message)
  return data as (IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null })[]
}

export interface DateRange {
  from: string
  to: string
}

// Payments for a specific calendar range (typically one month — see
// utils/month.ts#monthRange), newest first. [from, to) — `to` is exclusive.
export async function getPaymentsInRange({ from, to }: DateRange) {
  const { data, error } = await supabase
    .from("pagos")
    .select(`*, proyectos (name, clientes (name))`)
    .gte("payment_date", from)
    .lt("payment_date", to)
    .order("payment_date", { ascending: false })
  if (error) throw new Error(error.message)
  return data as (IPayment & { proyectos?: { name: string; clientes?: { name: string } | null } | null })[]
}

// Paid vs. pending totals for a range (typically a year — see
// utils/month.ts#yearRange). Selects only amount+status and reduces
// client-side rather than relying on Postgres aggregates, so it stays
// RLS-safe with the same row-level policy as every other pagos query.
export interface PaymentTotals {
  paid: number
  pending: number
  /** Pending amount per "YYYY-MM" — tells the UI WHICH months still owe money. */
  pendingByMonth: Record<string, number>
}

export async function getPaymentTotals({ from, to }: DateRange): Promise<PaymentTotals> {
  const { data, error } = await supabase
    .from("pagos")
    .select("amount,status,payment_date")
    .gte("payment_date", from)
    .lt("payment_date", to)
  if (error) throw new Error(error.message)
  const rows = data as { amount: number; status: string; payment_date: string | null }[]
  return rows.reduce<PaymentTotals>(
    (totals, row) => {
      const amount = Number(row.amount)
      if (row.status === "pagado") {
        totals.paid += amount
      } else if (row.status === "pendiente") {
        totals.pending += amount
        if (row.payment_date) {
          const monthKey = row.payment_date.slice(0, 7)
          totals.pendingByMonth[monthKey] = (totals.pendingByMonth[monthKey] ?? 0) + amount
        }
      }
      return totals
    },
    { paid: 0, pending: 0, pendingByMonth: {} },
  )
}

// Pagos de un proyecto (hub), más recientes primero.
export async function getPaymentsByProject(projectId: string): Promise<IPayment[]> {
  const { data, error } = await supabase
    .from("pagos")
    .select("*")
    .eq("project_id", projectId)
    .order("payment_date", { ascending: false })
  if (error) throw new Error(error.message)
  return data as IPayment[]
}

export async function createPayment(payment: IPayment) {
  const { data: { user } } = await supabase.auth.getUser()
  const { error } = await supabase
    .from("pagos")
    .insert({
      ...payment,
      user_id: user?.id,
      payment_date: payment.payment_date || new Date().toISOString().split("T")[0],
    })
  if (error) throw new Error(error.message)
}

export async function updatePayment(id: string, payment: Partial<IPayment>) {
  const { error } = await supabase
    .from("pagos")
    .update({ ...payment, payment_date: payment.payment_date || null })
    .eq("id", id)
  if (error) throw new Error(error.message)
}

export async function deletePayment(id: string) {
  const { error } = await supabase
    .from("pagos").delete().eq("id", id)
  if (error) throw new Error(error.message)
}
