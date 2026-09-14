import { describe, expect, it } from "vitest"
import { mapSupabaseError } from "./supabaseErrors"
import { LimitExceededError } from "../features/billing/domain/errors"

describe("mapSupabaseError", () => {
  it("maps a LIMIT_EXCEEDED PostgrestError into a LimitExceededError", () => {
    const error = mapSupabaseError({
      message: "LIMIT_EXCEEDED",
      details: JSON.stringify({ resource: "clientes", limit: 3, current: 3, plan: "free" }),
    })

    expect(error).toBeInstanceOf(LimitExceededError)
    expect((error as LimitExceededError).resource).toBe("clientes")
    expect((error as LimitExceededError).limit).toBe(3)
  })

  it("maps an unrelated Postgres error into a generic Error carrying its message (triangulation)", () => {
    const error = mapSupabaseError({ message: "duplicate key value violates unique constraint", details: null })

    expect(error).not.toBeInstanceOf(LimitExceededError)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toBe("duplicate key value violates unique constraint")
  })

  it("falls back to a generic message when the error has none", () => {
    const error = mapSupabaseError({})
    expect(error.message).toBe("Ocurrió un error inesperado.")
  })
})
