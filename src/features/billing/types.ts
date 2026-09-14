export type PlanCode = "free" | "pro_monthly" | "pro_yearly"

export type SubscriptionStatus = "free" | "active" | "past_due" | "canceled"

export type EntitlementResource = "clientes" | "proyectos"

export interface EntitlementLimits {
  clientes: number | null
  proyectos: number | null
}

export interface EntitlementUsage {
  clientes: number
  proyectos: number
}

// Shape returned by the `get_entitlements()` RPC — see
// supabase/migrations/20260914182000_entitlements.sql (source of truth).
// NOTE: Free users have status "free" (not "active"); keys are
// current_period_end / cancel_at_period_end / grace_until — per
// sdd/saas-conversion/m1a-done spec correction.
export interface Entitlements {
  plan: PlanCode
  status: SubscriptionStatus
  limits: EntitlementLimits
  usage: EntitlementUsage
  current_period_end: string | null
  cancel_at_period_end: boolean
  grace_until: string | null
}
