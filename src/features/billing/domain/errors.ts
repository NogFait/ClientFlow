import type { EntitlementResource } from "../types"

export interface LimitExceededDetails {
  resource: EntitlementResource
  limit: number
  current: number
  plan: string
}

// Thrown when the `check_plan_limit()` Postgres trigger rejects an INSERT.
// Error contract (design §1): supabase-js surfaces it as a PostgrestError with
// message === 'LIMIT_EXCEEDED' and details === JSON.stringify(LimitExceededDetails).
export class LimitExceededError extends Error {
  readonly resource: EntitlementResource
  readonly limit: number
  readonly current: number
  readonly plan: string

  constructor(details: LimitExceededDetails) {
    super("LIMIT_EXCEEDED")
    this.name = "LimitExceededError"
    this.resource = details.resource
    this.limit = details.limit
    this.current = details.current
    this.plan = details.plan
  }
}

// Minimal shape we depend on from supabase-js's PostgrestError — kept local so
// this module (and its tests) never import @supabase/supabase-js.
export interface PostgrestErrorLike {
  message?: string | null
  details?: string | null
  code?: string | null
}

function isLimitExceededDetails(value: unknown): value is LimitExceededDetails {
  if (typeof value !== "object" || value === null) return false
  const v = value as Record<string, unknown>
  return (
    (v.resource === "clientes" || v.resource === "proyectos") &&
    typeof v.limit === "number" &&
    typeof v.current === "number" &&
    typeof v.plan === "string"
  )
}

// Returns null for anything that isn't a well-formed LIMIT_EXCEEDED error —
// callers (mapSupabaseError) fall back to a generic Error in that case.
export function parseLimitExceeded(error: PostgrestErrorLike | null | undefined): LimitExceededError | null {
  if (!error || error.message !== "LIMIT_EXCEEDED" || !error.details) return null

  let parsed: unknown
  try {
    parsed = JSON.parse(error.details)
  } catch {
    return null
  }

  if (!isLimitExceededDetails(parsed)) return null

  return new LimitExceededError(parsed)
}
