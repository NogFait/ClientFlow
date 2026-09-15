import type { Entitlements, PlanCode } from "../types"

export interface PlanCardState {
  isCurrent: boolean
  isRecommended: boolean
  cta: "current" | "upgrade" | "none"
}

// canceled is terminal — the plan code on the record is historical, the user
// has no active paid entitlement, so they read as being back on Free.
function hasActivePaidPlan(entitlements: Entitlements): boolean {
  return entitlements.plan !== "free" && (entitlements.status === "active" || entitlements.status === "past_due")
}

export function resolvePlanCardState(entitlements: Entitlements, planCode: PlanCode): PlanCardState {
  const isCurrent =
    planCode === "free" ? !hasActivePaidPlan(entitlements) : hasActivePaidPlan(entitlements) && entitlements.plan === planCode

  const isRecommended = planCode === "pro_yearly" && !isCurrent

  const cta: PlanCardState["cta"] = isCurrent ? "current" : planCode === "free" ? "none" : "upgrade"

  return { isCurrent, isRecommended, cta }
}
