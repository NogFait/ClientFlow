import { describe, expect, it } from "vitest"
import { mapSupabaseError, ForeignKeyViolationError } from "./supabaseErrors"
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

  it("falls back to the UNEXPECTED_ERROR code (translated by the UI, never shown raw) when the error has none", () => {
    const error = mapSupabaseError({})
    expect(error.message).toBe("UNEXPECTED_ERROR")
  })

  it("maps a 23503 PostgrestError into a ForeignKeyViolationError, parsing the constraint from the message", () => {
    const error = mapSupabaseError({
      code: "23503",
      message: 'update or delete on table "clientes" violates foreign key constraint "proyectos_client_id_fkey" on table "proyectos"',
      details: "Key (id)=(abc-123) is still referenced from table \"proyectos\".",
    })

    expect(error).toBeInstanceOf(ForeignKeyViolationError)
    expect((error as ForeignKeyViolationError).constraint).toBe("proyectos_client_id_fkey")
  })

  it("parses a different constraint name from a 23503 error (triangulation: different constraint)", () => {
    const error = mapSupabaseError({
      code: "23503",
      message: 'update or delete on table "clientes" violates foreign key constraint "facturas_client_id_fkey" on table "facturas"',
      details: null,
    })

    expect(error).toBeInstanceOf(ForeignKeyViolationError)
    expect((error as ForeignKeyViolationError).constraint).toBe("facturas_client_id_fkey")
  })

  it("still maps to ForeignKeyViolationError when no constraint name can be parsed (triangulation: missing detail)", () => {
    const error = mapSupabaseError({ code: "23503", message: "foreign key violation", details: null })

    expect(error).toBeInstanceOf(ForeignKeyViolationError)
    expect((error as ForeignKeyViolationError).constraint).toBeUndefined()
  })
})
