import type { Entitlements, EntitlementResource } from "../types"

// Soft, client-side pre-check only — Postgres (check_plan_limit trigger) is the
// authoritative enforcement point. While entitlements haven't loaded yet we do
// not block: the UI degrades to "let the server decide" rather than flashing a
// false positive.
export function canCreate(entitlements: Entitlements | null, resource: EntitlementResource): boolean {
  if (!entitlements) return true

  const limit = entitlements.limits[resource]
  if (limit === null) return true

  return entitlements.usage[resource] < limit
}

// Slots left for a resource, or null when the plan is unlimited for it.
export function remaining(entitlements: Entitlements | null, resource: EntitlementResource): number | null {
  if (!entitlements) return null

  const limit = entitlements.limits[resource]
  if (limit === null) return null

  return Math.max(0, limit - entitlements.usage[resource])
}

export function isPro(entitlements: Entitlements | null): boolean {
  if (!entitlements) return false
  return entitlements.plan !== "free"
}
