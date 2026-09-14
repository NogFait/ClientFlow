import { beforeEach, describe, expect, it, vi } from "vitest"
import { getEntitlements } from "./services"
import type { Entitlements } from "./types"

// WARNING from sdd/saas-conversion/verify-report-m1 (#1132): getEntitlements()
// had no colocated test — the only consumer test (useEntitlements.test.tsx)
// mocks the whole `../services` module, so the RPC call itself and its error
// branch were never exercised. This mocks one level lower (the supabase
// client) so the module's own logic actually runs.
const rpcMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}))

beforeEach(() => {
  rpcMock.mockReset()
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
