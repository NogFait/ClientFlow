import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import type { Entitlements } from "../types"
import type { useEntitlements as UseEntitlementsFn } from "./useEntitlements"

const getEntitlementsMock = vi.fn<() => Promise<Entitlements | null>>()

vi.mock("../services", () => ({
  getEntitlements: () => getEntitlementsMock(),
}))

// The hook module reads BILLING_ENABLED at import time, so each test needs a
// fresh module instance (via vi.resetModules) taken AFTER stubbing the env var.
function makeProbe(useEntitlementsHook: typeof UseEntitlementsFn) {
  return function Probe() {
    const { entitlements, loading } = useEntitlementsHook()
    if (loading) return <span>loading</span>
    return (
      <span data-testid="plan">
        {entitlements ? `${entitlements.plan}:${entitlements.limits.clientes}` : "none"}
      </span>
    )
  }
}

beforeEach(() => {
  getEntitlementsMock.mockReset()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe("useEntitlements", () => {
  it("fetches entitlements from the service on mount when billing is enabled", async () => {
    vi.stubEnv("VITE_BILLING_ENABLED", "true")
    vi.resetModules()
    const { useEntitlements } = await import("./useEntitlements")

    const fakeEntitlements: Entitlements = {
      plan: "free",
      status: "free",
      limits: { clientes: 3, proyectos: 5 },
      usage: { clientes: 1, proyectos: 0 },
      current_period_end: null,
      cancel_at_period_end: false,
      grace_until: null,
    }
    getEntitlementsMock.mockResolvedValue(fakeEntitlements)

    const Probe = makeProbe(useEntitlements)
    render(<Probe />)

    await waitFor(() => expect(screen.getByTestId("plan")).toHaveTextContent("free:3"))
    expect(getEntitlementsMock).toHaveBeenCalledTimes(1)
  })

  it("returns unlimited no-op entitlements and never calls the service when billing is disabled (triangulation)", async () => {
    vi.stubEnv("VITE_BILLING_ENABLED", "false")
    vi.resetModules()
    const { useEntitlements } = await import("./useEntitlements")

    const Probe = makeProbe(useEntitlements)
    render(<Probe />)

    await waitFor(() => expect(screen.getByTestId("plan")).toHaveTextContent("pro_yearly:null"))
    expect(getEntitlementsMock).not.toHaveBeenCalled()
  })
})
