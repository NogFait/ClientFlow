import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"

const createClientMock = vi.fn(() => ({ __client: "fake" }))

vi.mock("@supabase/supabase-js", () => ({
  createClient: createClientMock,
}))

const ORIGINAL_URL = process.env.SUPABASE_URL
const ORIGINAL_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

beforeEach(() => {
  vi.resetModules()
  createClientMock.mockClear()
  process.env.SUPABASE_URL = "https://proj.supabase.co"
  process.env.SUPABASE_SERVICE_ROLE_KEY = "service-role-key"
})

afterEach(() => {
  if (ORIGINAL_URL === undefined) delete process.env.SUPABASE_URL
  else process.env.SUPABASE_URL = ORIGINAL_URL
  if (ORIGINAL_KEY === undefined) delete process.env.SUPABASE_SERVICE_ROLE_KEY
  else process.env.SUPABASE_SERVICE_ROLE_KEY = ORIGINAL_KEY
})

describe("getSupabaseAdmin", () => {
  it("creates a client with the service-role key and no session persistence", async () => {
    const { getSupabaseAdmin } = await import("./supabaseAdmin")

    getSupabaseAdmin()

    expect(createClientMock).toHaveBeenCalledWith(
      "https://proj.supabase.co",
      "service-role-key",
      expect.objectContaining({ auth: expect.objectContaining({ persistSession: false }) })
    )
  })

  it("memoizes the client across calls instead of constructing it twice", async () => {
    const { getSupabaseAdmin } = await import("./supabaseAdmin")

    const first = getSupabaseAdmin()
    const second = getSupabaseAdmin()

    expect(first).toBe(second)
    expect(createClientMock).toHaveBeenCalledTimes(1)
  })
})
