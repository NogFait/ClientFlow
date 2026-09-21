import { afterEach, describe, expect, it, vi } from "vitest"

const fromMock = vi.fn()
const getUserMock = vi.fn()
vi.mock("../../services/supabaseClient", () => ({
  supabase: { from: (...a: unknown[]) => fromMock(...a), auth: { getUser: () => getUserMock() } },
}))

afterEach(() => {
  fromMock.mockReset()
  getUserMock.mockReset()
})

describe("getUserSettings", () => {
  it("returns the stored row, scoped by RLS to the current user", async () => {
    const maybeSingle = vi.fn().mockResolvedValue({ data: { weekly_digest: false }, error: null })
    fromMock.mockReturnValue({ select: () => ({ maybeSingle }) })
    const { getUserSettings } = await import("./services")

    await expect(getUserSettings()).resolves.toEqual({ weekly_digest: false })
    expect(fromMock).toHaveBeenCalledWith("user_settings")
  })

  it("falls back to the defaults (digest on) when the user has no row yet", async () => {
    fromMock.mockReturnValue({ select: () => ({ maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }) }) })
    const { getUserSettings } = await import("./services")

    await expect(getUserSettings()).resolves.toEqual({ weekly_digest: true })
  })
})

describe("setWeeklyDigest", () => {
  it("upserts the user's row (first write creates it) with the flag", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } })
    const upsert = vi.fn().mockResolvedValue({ error: null })
    fromMock.mockReturnValue({ upsert })
    const { setWeeklyDigest } = await import("./services")

    await setWeeklyDigest(false)

    expect(upsert).toHaveBeenCalledWith({ user_id: "u1", weekly_digest: false }, { onConflict: "user_id" })
  })

  it("throws the Supabase message on failure", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } })
    fromMock.mockReturnValue({ upsert: vi.fn().mockResolvedValue({ error: { message: "nope" } }) })
    const { setWeeklyDigest } = await import("./services")

    await expect(setWeeklyDigest(true)).rejects.toThrow("nope")
  })
})
