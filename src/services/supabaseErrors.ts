import { parseLimitExceeded, type PostgrestErrorLike } from "../features/billing/domain/errors"

// Thrown when Postgres rejects a write with SQLSTATE 23503 (foreign_key_violation) —
// e.g. deleting a cliente that still has proyectos referencing it via
// proyectos_client_id_fkey (no ON DELETE action by design: block & explain,
// not cascade). `constraint` is best-effort, parsed from the error text.
export class ForeignKeyViolationError extends Error {
  readonly constraint?: string

  constructor(constraint?: string) {
    super("FOREIGN_KEY_VIOLATION")
    this.name = "ForeignKeyViolationError"
    this.constraint = constraint
  }
}

// Postgres quotes the constraint name in the message as: violates foreign
// key constraint "some_fkey_name". Falls back to details when message
// doesn't carry it (both are checked since PostgREST's wording can vary).
function parseConstraintName(error: PostgrestErrorLike): string | undefined {
  const source = `${error.message ?? ""} ${error.details ?? ""}`
  const match = /constraint "([^"]+)"/.exec(source)
  return match?.[1]
}

// Central mapping point for every Supabase write in the app: turns the raw
// PostgrestError into a LimitExceededError or ForeignKeyViolationError when
// it matches a known contract, otherwise a generic Error with its message
// preserved. Callers (clients/projects services) throw the result.
export function mapSupabaseError(error: PostgrestErrorLike): Error {
  const limitError = parseLimitExceeded(error)
  if (limitError) return limitError

  if (error.code === "23503") {
    return new ForeignKeyViolationError(parseConstraintName(error))
  }

  return new Error(error.message ?? "Ocurrió un error inesperado.")
}
