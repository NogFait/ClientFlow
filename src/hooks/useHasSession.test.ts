import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, waitFor } from "@testing-library/react"
import { useHasSession } from "./useHasSession"

const getUserMock = vi.fn()

vi.mock("../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: () => getUserMock(),
    },
  },
}))

beforeEach(() => {
  getUserMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("useHasSession", () => {
  it("starts loading with hasSession false, then reports true once a user is resolved", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } } })

    const { result } = renderHook(() => useHasSession())

    expect(result.current.loading).toBe(true)
    expect(result.current.hasSession).toBe(false)

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasSession).toBe(true)
  })

  it("reports hasSession false once resolved with no user (triangulation: anonymous visitor)", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })

    const { result } = renderHook(() => useHasSession())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.hasSession).toBe(false)
  })
})
