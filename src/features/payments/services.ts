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
export async function getPaymentTotals({ from, to }: DateRange): Promise<{ paid: number; pending: number }> {
  const { data, error } = await supabase
    .from("pagos")
    .select("amount,status")
    .gte("payment_date", from)
    .lt("payment_date", to)
  if (error) throw new Error(error.message)
  const rows = data as { amount: number; status: string }[]
  return rows.reduce(
    (totals, row) => {
      if (row.status === "pagado") totals.paid += Number(row.amount)
      else if (row.status === "pendiente") totals.pending += Number(row.amount)
      return totals
    },
    { paid: 0, pending: 0 },
  )
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
