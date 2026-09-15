import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import type { Entitlements } from "../../../features/billing/types"

const refreshMock = vi.fn()
const upgradeMock = vi.fn()
const manageMock = vi.fn()

const freeEntitlements: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 1, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

let entitlementsContextValue: { entitlements: Entitlements | null; loading: boolean; refresh: typeof refreshMock }

vi.mock("../../../features/billing/context/entitlementsContext", () => ({
  useEntitlementsContext: () => entitlementsContextValue,
}))

vi.mock("../../../features/billing/hooks/useCheckout", () => ({
  useCheckout: () => ({ upgrade: upgradeMock, manage: manageMock, loading: false, error: null }),
}))

async function renderAt(path: string) {
  const { default: BillingSettingsPage } = await import("./BillingSettingsPage")
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/settings/billing" element={<BillingSettingsPage />} />
        <Route path="/dashboard" element={<div>Dashboard Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  refreshMock.mockReset().mockResolvedValue(undefined)
  upgradeMock.mockReset()
  manageMock.mockReset()
  entitlementsContextValue = { entitlements: freeEntitlements, loading: false, refresh: refreshMock }
})

afterEach(() => {
  vi.doUnmock("../../../config/features")
  vi.resetModules()
  vi.useRealTimers()
})

describe("BillingSettingsPage — feature flag gate", () => {
  it("redirects to /dashboard when billing is disabled", async () => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: false }))

    await renderAt("/settings/billing")

    expect(await screen.findByText("Dashboard Mock")).toBeInTheDocument()
    expect(screen.queryByText("Plan y facturación")).not.toBeInTheDocument()
  })
})

describe("BillingSettingsPage — enabled", () => {
  beforeEach(() => {
    vi.doMock("../../../config/features", () => ({ BILLING_ENABLED: true }))
  })

  it("shows a loader while entitlements are loading (triangulation: no entitlements yet)", async () => {
    entitlementsContextValue = { entitlements: null, loading: true, refresh: refreshMock }

    await renderAt("/settings/billing")

    expect(screen.getByText("Plan y facturación")).toBeInTheDocument()
    expect(screen.queryByText("Free")).not.toBeInTheDocument()
  })

  it("renders BillingSettings composed with the loaded entitlements", async () => {
    await renderAt("/settings/billing")

    await waitFor(() => expect(screen.getByText("Free", { selector: "span" })).toBeInTheDocument())
    expect(screen.getByText("1 / 3")).toBeInTheDocument()
  })

  it("on ?checkout=success, shows an updating banner and polls refresh up to 3 times before clearing it", async () => {
    vi.useFakeTimers()

    await renderAt("/settings/billing?checkout=success")

    expect(screen.getByText(/Actualizando tu plan/i)).toBeInTheDocument()

    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(1))
    await vi.advanceTimersByTimeAsync(2000)
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(2))
    await vi.advanceTimersByTimeAsync(2000)
    await vi.waitFor(() => expect(refreshMock).toHaveBeenCalledTimes(3))

    await vi.waitFor(() => expect(screen.queryByText(/Actualizando tu plan/i)).not.toBeInTheDocument())
  })

  it("does NOT poll refresh when there is no checkout query param (triangulation)", async () => {
    await renderAt("/settings/billing")

    await waitFor(() => expect(screen.getByText("Free", { selector: "span" })).toBeInTheDocument())
    expect(refreshMock).not.toHaveBeenCalled()
    expect(screen.queryByText(/Actualizando tu plan/i)).not.toBeInTheDocument()
  })
})
