import { describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import BillingSettings from "./BillingSettings"
import { renderWithLang } from "../../../../test/i18n"
import type { Entitlements } from "../../types"

const scheduledCancelPro: Entitlements = {
  plan: "pro_monthly",
  status: "active",
  limits: { clientes: null, proyectos: null },
  usage: { clientes: 40, proyectos: 12 },
  current_period_end: "2026-11-01T00:00:00.000Z",
  cancel_at_period_end: true,
  grace_until: null,
}

const free: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 2, proyectos: 5 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

describe("BillingSettings — English", () => {
  it("renders the status line with an English long date, translated meters, plan names and CTAs", () => {
    renderWithLang(<BillingSettings entitlements={scheduledCancelPro} onUpgrade={vi.fn()} onManage={vi.fn()} />, "en")

    expect(screen.getByText("Ends on November 1, 2026 — you can reactivate it anytime")).toBeInTheDocument()
    expect(screen.getByText("40 — unlimited")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Reactivate subscription" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Manage subscription" })).toBeInTheDocument()
    // Plan names come from the translated catalog, on the badge and the cards.
    expect(screen.getAllByText("Pro monthly").length).toBeGreaterThan(0)
    expect(screen.getByRole("button", { name: "Your current plan" })).toBeInTheDocument()
    expect(screen.getByText("Current plan")).toBeInTheDocument()
    expect(screen.queryByText(/ilimitado/)).not.toBeInTheDocument()
  })

  it("Free user sees 'Free plan' and English upgrade CTAs (triangulation)", () => {
    renderWithLang(<BillingSettings entitlements={free} onUpgrade={vi.fn()} onManage={vi.fn()} />, "en")

    expect(screen.getByText("Free plan")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Choose Pro monthly" })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "Choose Pro yearly" })).toBeInTheDocument()
    expect(screen.getByText("Recommended")).toBeInTheDocument()
  })
})
