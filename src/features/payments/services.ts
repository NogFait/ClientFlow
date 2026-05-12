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
