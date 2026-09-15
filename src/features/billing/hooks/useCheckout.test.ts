import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useCheckout } from "./useCheckout"
import { BillingApiError } from "../services"

const startCheckoutMock = vi.fn()
const openPortalMock = vi.fn()

// `../services` (loaded via importActual below) imports the real Supabase
// client, which calls createClient() at module load and throws without
// VITE_SUPABASE_URL. Mock the client so this test never depends on env.
vi.mock("../../../services/supabaseClient", () => ({
  supabase: { auth: { getSession: vi.fn() } },
}))

vi.mock("../services", async () => {
  const actual = await vi.importActual<typeof import("../services")>("../services")
  return {
    ...actual,
    startCheckout: (...args: unknown[]) => startCheckoutMock(...args),
    openPortal: () => openPortalMock(),
  }
})

beforeEach(() => {
  startCheckoutMock.mockReset()
  openPortalMock.mockReset()
})

afterEach(() => {
  vi.clearAllMocks()
})

describe("useCheckout", () => {
  it("upgrade(plan) calls startCheckout with the chosen plan and clears error", async () => {
    startCheckoutMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCheckout())

    await act(async () => {
      await result.current.upgrade("pro_monthly")
    })

    expect(startCheckoutMock).toHaveBeenCalledWith("pro_monthly")
    expect(result.current.error).toBeNull()
  })

  it("manage() calls openPortal (triangulation: different action, no args)", async () => {
    openPortalMock.mockResolvedValue(undefined)
    const { result } = renderHook(() => useCheckout())

    await act(async () => {
      await result.current.manage()
    })

    expect(openPortalMock).toHaveBeenCalledTimes(1)
    expect(result.current.error).toBeNull()
  })

  it("sets a Spanish message and clears loading when startCheckout rejects with a known BillingApiError code", async () => {
    startCheckoutMock.mockRejectedValue(new BillingApiError("already_subscribed", 409))
    const { result } = renderHook(() => useCheckout())

    await act(async () => {
      await result.current.upgrade("pro_yearly")
    })

    expect(result.current.error).toBe("Ya tenés una suscripción Pro activa.")
    expect(result.current.loading).toBe(false)
  })

  it("falls back to a generic message for an unmapped error code (triangulation)", async () => {
    openPortalMock.mockRejectedValue(new BillingApiError("weird_unknown_code", 500))
    const { result } = renderHook(() => useCheckout())

    await act(async () => {
      await result.current.manage()
    })

    expect(result.current.error).toBe("Ocurrió un error. Intentalo de nuevo.")
  })

  it("sets loading true while the request is in flight", async () => {
    let resolvePromise: () => void = () => {}
    startCheckoutMock.mockReturnValue(
      new Promise<void>((resolve) => {
        resolvePromise = resolve
      }),
    )
    const { result } = renderHook(() => useCheckout())

    act(() => {
      void result.current.upgrade("pro_monthly")
    })

    await waitFor(() => expect(result.current.loading).toBe(true))

    await act(async () => {
      resolvePromise()
      await Promise.resolve()
    })
  })
})
