export type PaymentMethod = "efectivo" | "transferencia" | "tarjeta" | "other"
export type PaymentStatus = "pendiente" | "pagado"

export interface IPayment {
  id?: string
  user_id?: string
  project_id?: string
  amount: number
  payment_date?: string
  method: PaymentMethod
  status: PaymentStatus
  notes?: string
  created_at?: string
}
