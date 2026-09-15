import { beforeEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Routes, Route, useSearchParams } from "react-router-dom"
import PricingPage from "./PricingPage"

let hasSessionValue: { hasSession: boolean; loading: boolean }
const upgradeMock = vi.fn()

vi.mock("../../hooks/useHasSession", () => ({
  useHasSession: () => hasSessionValue,
}))

vi.mock("../../features/billing/hooks/useCheckout", () => ({
  useCheckout: () => ({ upgrade: upgradeMock, manage: vi.fn(), loading: false, error: null }),
}))

// Most scenarios below exercise the "billing enabled" world (default env in
// this repo is VITE_BILLING_ENABLED=false — M2c hasn't deployed yet); the
// one test that specifically covers the disabled-flag defense-in-depth path
// overrides this via vi.doMock + a fresh dynamic import.
vi.mock("../../config/features", () => ({ BILLING_ENABLED: true }))

function RegisterProbe() {
  const [params] = useSearchParams()
  return <div data-testid="register-page">register:{params.get("plan") ?? "none"}</div>
}

function renderPricingPage() {
  render(
    <MemoryRouter initialEntries={["/pricing"]}>
      <Routes>
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/register" element={<RegisterProbe />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  hasSessionValue = { hasSession: false, loading: false }
  upgradeMock.mockReset()
})

describe("PricingPage — CTA routing by auth state (spec pricing-page)", () => {
  it("anonymous visitor clicking the Pro CTA is routed to signup with the plan preserved as a query param", async () => {
    const user = userEvent.setup()
    renderPricingPage()

    await user.click(screen.getByRole("button", { name: /Elegir Pro/i }))

    expect(await screen.findByTestId("register-page")).toHaveTextContent("register:pro_monthly")
  })

  it("anonymous visitor toggling Anual then clicking the Pro CTA preserves pro_yearly (triangulation: different plan/interval)", async () => {
    const user = userEvent.setup()
    renderPricingPage()

    await user.click(screen.getByRole("button", { name: /Anual/i }))
    await user.click(screen.getByRole("button", { name: /Elegir Pro/i }))

    expect(await screen.findByTestId("register-page")).toHaveTextContent("register:pro_yearly")
  })

  it("anonymous visitor clicking the Free CTA is routed to signup with no plan param", async () => {
    const user = userEvent.setup()
    renderPricingPage()

    await user.click(screen.getByRole("button", { name: /gratis/i }))

    expect(await screen.findByTestId("register-page")).toHaveTextContent("register:none")
  })

  it("authenticated Free user clicking the Pro CTA goes straight into checkout with the chosen plan (spec: skip signup)", async () => {
    hasSessionValue = { hasSession: true, loading: false }
    const user = userEvent.setup()
    renderPricingPage()

    await user.click(screen.getByRole("button", { name: /Elegir Pro/i }))

    expect(upgradeMock).toHaveBeenCalledWith("pro_monthly")
    expect(screen.queryByTestId("register-page")).not.toBeInTheDocument()
  })

  it("authenticated user clicking the Free CTA is routed to the dashboard instead of signup (triangulation)", async () => {
    hasSessionValue = { hasSession: true, loading: false }
    const user = userEvent.setup()
    renderPricingPage()

    await user.click(screen.getByRole("button", { name: /gratis/i }))

    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument()
  })

  it("authenticated user clicking the Pro CTA while billing is disabled goes to the dashboard instead of checkout (defense in depth)", async () => {
    vi.resetModules()
    vi.doMock("../../config/features", () => ({ BILLING_ENABLED: false }))
    const { default: PricingPageDisabled } = await import("./PricingPage")
    hasSessionValue = { hasSession: true, loading: false }
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={["/pricing"]}>
        <Routes>
          <Route path="/pricing" element={<PricingPageDisabled />} />
          <Route path="/dashboard" element={<div data-testid="dashboard-page">dashboard</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole("button", { name: /Elegir Pro/i }))

    expect(await screen.findByTestId("dashboard-page")).toBeInTheDocument()
    expect(upgradeMock).not.toHaveBeenCalled()

    vi.doUnmock("../../config/features")
    vi.resetModules()
  })
})
