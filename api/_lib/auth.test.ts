import { describe, expect, it, vi } from "vitest"
import { getUserFromRequest, sendUnauthorized } from "./auth.js"

function fakeSupabase(getUserImpl: (token: string) => Promise<{ data: { user: { id: string; email: string | null } | null }; error: unknown }>) {
  return { auth: { getUser: vi.fn(getUserImpl) } } as unknown as Parameters<typeof getUserFromRequest>[1]
}

describe("getUserFromRequest", () => {
  it("returns the user id and email for a valid Bearer token", async () => {
    const supabase = fakeSupabase(async (token) => {
      expect(token).toBe("valid-token")
      return { data: { user: { id: "user-1", email: "a@b.com" } }, error: null }
    })

    const result = await getUserFromRequest({ headers: { authorization: "Bearer valid-token" } }, supabase)

    expect(result).toEqual({ userId: "user-1", email: "a@b.com" })
  })

  it("returns null when there is no Authorization header", async () => {
    const supabase = fakeSupabase(async () => ({ data: { user: null }, error: null }))

    const result = await getUserFromRequest({ headers: {} }, supabase)

    expect(result).toBeNull()
  })

  it("returns null when the header does not start with 'Bearer '", async () => {
    const supabase = fakeSupabase(async () => ({ data: { user: null }, error: null }))

    const result = await getUserFromRequest({ headers: { authorization: "Basic xyz" } }, supabase)

    expect(result).toBeNull()
  })

  it("returns null when supabase rejects the token", async () => {
    const supabase = fakeSupabase(async () => ({ data: { user: null }, error: new Error("invalid JWT") }))

    const result = await getUserFromRequest({ headers: { authorization: "Bearer bad-token" } }, supabase)

    expect(result).toBeNull()
  })
})

describe("sendUnauthorized", () => {
  it("sends a 401 with a JSON error body", () => {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const res = { status } as unknown as Parameters<typeof sendUnauthorized>[0]

    sendUnauthorized(res)

    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: "unauthorized" })
  })
})
