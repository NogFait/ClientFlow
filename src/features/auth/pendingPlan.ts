// Bridges the gap between /pricing (anonymous CTA -> /register?plan=<code>)
// and the point where the visitor is actually authenticated for the first
// time. A query param alone doesn't survive the register -> login hop (this
// app never auto-authenticates right after signUp — see useRegisterForm),
// so the chosen plan is parked in sessionStorage until ProtectedRoute sees
// an authenticated session and redirects into /settings/billing?plan=<code>.
const STORAGE_KEY = "clientflow.pendingPlan"

export type PendingPlan = "pro_monthly" | "pro_yearly"

const VALID_PLANS: readonly PendingPlan[] = ["pro_monthly", "pro_yearly"]

function isPendingPlan(value: string | null): value is PendingPlan {
  return value !== null && (VALID_PLANS as readonly string[]).includes(value)
}

// Silently ignores anything that isn't a paid plan code (e.g. "free" or a
// malformed query param) — nothing to persist, nothing to redirect to later.
export function storePendingPlan(plan: string): void {
  if (!isPendingPlan(plan)) return
  try {
    sessionStorage.setItem(STORAGE_KEY, plan)
  } catch {
    // Private browsing / storage disabled — the plan preselection is a nice
    // to have, never worth failing signup over.
  }
}

export function readPendingPlan(): PendingPlan | null {
  try {
    const value = sessionStorage.getItem(STORAGE_KEY)
    return isPendingPlan(value) ? value : null
  } catch {
    return null
  }
}

export function clearPendingPlan(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    // ignore — see storePendingPlan
  }
}
