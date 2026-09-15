import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { getEntitlements, startCheckout, openPortal, BillingApiError } from "./services"
import type { Entitlements } from "./types"

// WARNING from sdd/saas-conversion/verify-report-m1 (#1132): getEntitlements()
// had no colocated test — the only consumer test (useEntitlements.test.tsx)
// mocks the whole `../services` module, so the RPC call itself and its error
// branch were never exercised. This mocks one level lower (the supabase
// client) so the module's own logic actually runs.
const rpcMock = vi.fn()
const getSessionMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    rpc: (...args: unknown[]) => rpcMock(...args),
    auth: { getSession: () => getSessionMock() },
  },
}))

beforeEach(() => {
  rpcMock.mockReset()
  getSessionMock.mockReset()
})

describe("getEntitlements", () => {
  it("calls supabase.rpc('get_entitlements') and returns the parsed data", async () => {
    const fakeEntitlements: Entitlements = {
      plan: "free",
      status: "free",
      limits: { clientes: 3, proyectos: 5 },
      usage: { clientes: 1, proyectos: 0 },
      current_period_end: null,
      cancel_at_period_end: false,
      grace_until: null,
    }
    rpcMock.mockResolvedValue({ data: fakeEntitlements, error: null })

    const result = await getEntitlements()

    expect(rpcMock).toHaveBeenCalledWith("get_entitlements")
    expect(result).toEqual(fakeEntitlements)
  })

  it("returns null when the RPC succeeds with no subscription row (triangulation)", async () => {
    rpcMock.mockResolvedValue({ data: null, error: null })

    const result = await getEntitlements()

    expect(result).toBeNull()
    expect(rpcMock).toHaveBeenCalledTimes(1)
  })

  it("throws the RPC error message and never logs to console (triangulation)", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {})
    const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    rpcMock.mockResolvedValue({
      data: null,
      error: { message: "permission denied for function get_entitlements" },
    })

    await expect(getEntitlements()).rejects.toThrow("permission denied for function get_entitlements")
    expect(consoleErrorSpy).not.toHaveBeenCalled()
    expect(consoleLogSpy).not.toHaveBeenCalled()

    consoleErrorSpy.mockRestore()
    consoleLogSpy.mockRestore()
  })
})

describe("startCheckout / openPortal", () => {
  const fetchMock = vi.fn()
  const assignMock = vi.fn()
  const originalLocation = window.location

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock)
    // jsdom's window.location.assign throws "Not implemented" — replace the
    // whole location object with a stub so navigation is observable instead.
    Object.defineProperty(window, "location", {
      configurable: true,
      value: { ...originalLocation, assign: assignMock },
    })
  })

  afterEach(() => {
    fetchMock.mockReset()
    assignMock.mockReset()
    Object.defineProperty(window, "location", { configurable: true, value: originalLocation })
    vi.unstubAllGlobals()
  })

  it("startCheckout posts the plan with the session bearer token and navigates to the returned url", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "tok-123" } } })
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://polar.sh/checkout/abc" }),
    })

    await startCheckout("pro_monthly")

    expect(fetchMock).toHaveBeenCalledWith("/api/billing/checkout", {
      method: "POST",
      headers: { Authorization: "Bearer tok-123", "content-type": "application/json" },
      body: JSON.stringify({ plan: "pro_monthly" }),
    })
    expect(assignMock).toHaveBeenCalledWith("https://polar.sh/checkout/abc")
  })

  it("openPortal posts with no body to /api/billing/portal and navigates to the returned url (triangulation: different endpoint/plan)", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "tok-456" } } })
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ url: "https://polar.sh/portal/xyz" }),
    })

    await openPortal()

    expect(fetchMock).toHaveBeenCalledWith("/api/billing/portal", {
      method: "POST",
      headers: { Authorization: "Bearer tok-456", "content-type": "application/json" },
      body: undefined,
    })
    expect(assignMock).toHaveBeenCalledWith("https://polar.sh/portal/xyz")
  })

  it("throws BillingApiError with the server's code and status when the response is not ok", async () => {
    getSessionMock.mockResolvedValue({ data: { session: { access_token: "tok-123" } } })
    fetchMock.mockResolvedValue({
      ok: false,
      status: 403,
      json: async () => ({ error: "billing_disabled" }),
    })

    const error = await startCheckout("pro_yearly").catch((e) => e)

    expect(error).toBeInstanceOf(BillingApiError)
    expect(error.code).toBe("billing_disabled")
    expect(error.status).toBe(403)
    expect(assignMock).not.toHaveBeenCalled()
  })

  it("throws BillingApiError('unauthorized', 401) without calling fetch when there is no session (triangulation: different error path)", async () => {
    getSessionMock.mockResolvedValue({ data: { session: null } })

    const error = await openPortal().catch((e) => e)

    expect(error).toBeInstanceOf(BillingApiError)
    expect(error.code).toBe("unauthorized")
    expect(error.status).toBe(401)
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
