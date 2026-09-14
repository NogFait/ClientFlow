import { describe, expect, it } from "vitest"
import { LimitExceededError, parseLimitExceeded } from "./errors"

// Fake shape of what supabase-js's PostgrestError looks like for the
// LIMIT_EXCEEDED trigger — see supabase/migrations/20260914183000_limit_trigger.sql
function fakePostgrestError(overrides: Partial<{ message: string; details: string | null; code: string }> = {}) {
  return {
    code: "P0001",
    message: "LIMIT_EXCEEDED",
    details: JSON.stringify({ resource: "clientes", limit: 3, current: 3, plan: "free" }),
    hint: "upgrade",
    ...overrides,
  }
}

describe("parseLimitExceeded", () => {
  it("parses a LIMIT_EXCEEDED PostgrestError for clientes into a LimitExceededError", () => {
    const result = parseLimitExceeded(fakePostgrestError())

    expect(result).toBeInstanceOf(LimitExceededError)
    expect(result?.resource).toBe("clientes")
    expect(result?.limit).toBe(3)
    expect(result?.current).toBe(3)
    expect(result?.plan).toBe("free")
  })

  it("parses a LIMIT_EXCEEDED error for proyectos with different numbers (triangulation)", () => {
    const result = parseLimitExceeded(
      fakePostgrestError({
        details: JSON.stringify({ resource: "proyectos", limit: 5, current: 5, plan: "free" }),
      }),
    )

    expect(result?.resource).toBe("proyectos")
    expect(result?.limit).toBe(5)
    expect(result?.current).toBe(5)
  })

  it("returns null for an unrelated Postgres error", () => {
    const result = parseLimitExceeded(fakePostgrestError({ message: "duplicate key value", details: null }))
    expect(result).toBeNull()
  })

  it("returns null when details is missing even if the message matches", () => {
    const result = parseLimitExceeded(fakePostgrestError({ details: null }))
    expect(result).toBeNull()
  })

  it("returns null when details is not valid JSON", () => {
    const result = parseLimitExceeded(fakePostgrestError({ details: "not json" }))
    expect(result).toBeNull()
  })

  it("returns null when details JSON is missing required fields", () => {
    const result = parseLimitExceeded(fakePostgrestError({ details: JSON.stringify({ resource: "clientes" }) }))
    expect(result).toBeNull()
  })
})

describe("LimitExceededError", () => {
  it("carries the resource, limit, current and plan as own properties", () => {
    const error = new LimitExceededError({ resource: "proyectos", limit: 5, current: 5, plan: "free" })

    expect(error).toBeInstanceOf(Error)
    expect(error.name).toBe("LimitExceededError")
    expect(error.resource).toBe("proyectos")
    expect(error.limit).toBe(5)
    expect(error.current).toBe(5)
    expect(error.plan).toBe("free")
  })
})
