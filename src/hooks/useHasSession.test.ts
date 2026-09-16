import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook } from "@testing-library/react"
import { useHasSession } from "./useHasSession"
import type { AuthState } from "../features/auth/context/authContext"

let authState: AuthState

vi.mock("../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
}))

afterEach(() => {
  vi.clearAllMocks()
})

describe("useHasSession", () => {
  it("reports loading:true and hasSession:false while auth status is loading", () => {
    authState = { session: null, user: null, status: "loading" }

    const { result } = renderHook(() => useHasSession())

    expect(result.current.loading).toBe(true)
    expect(result.current.hasSession).toBe(false)
  })

  it("reports hasSession:true once authenticated", () => {
    authState = { session: null, user: { id: "user-1" } as never, status: "authenticated" }

    const { result } = renderHook(() => useHasSession())

    expect(result.current.loading).toBe(false)
    expect(result.current.hasSession).toBe(true)
  })

  it("reports hasSession:false for an anonymous visitor (triangulation)", () => {
    authState = { session: null, user: null, status: "anonymous" }

    const { result } = renderHook(() => useHasSession())

    expect(result.current.loading).toBe(false)
    expect(result.current.hasSession).toBe(false)
  })
})
