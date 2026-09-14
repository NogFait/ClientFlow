import { parseLimitExceeded, type PostgrestErrorLike } from "../features/billing/domain/errors"

// Central mapping point for every Supabase write in the app: turns the raw
// PostgrestError into a LimitExceededError when it matches the
// check_plan_limit() trigger contract, otherwise a generic Error with its
// message preserved. Callers (clients/projects services) throw the result.
export function mapSupabaseError(error: PostgrestErrorLike): Error {
  const limitError = parseLimitExceeded(error)
  if (limitError) return limitError

  return new Error(error.message ?? "Ocurrió un error inesperado.")
}
