import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import PlanCards from "./PlanCards"
import type { Entitlements } from "../../types"

const freeEntitlements: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 2, proyectos: 1 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

const proMonthlyEntitlements: Entitlements = {
  plan: "pro_monthly",
  status: "active",
  limits: { clientes: null, proyectos: null },
  usage: { clientes: 40, proyectos: 12 },
  current_period_end: "2026-11-01T00:00:00.000Z",
  cancel_at_period_end: false,
  grace_until: null,
}

describe("PlanCards", () => {
  it("Free user: Free card is marked current and disabled, both Pro cards offer upgrade, Pro anual is recommended", () => {
    render(<PlanCards entitlements={freeEntitlements} onUpgrade={vi.fn()} />)

    expect(screen.getAllByText("Plan actual")).toHaveLength(1)
    expect(screen.getByRole("button", { name: /Tu plan actual/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Elegir Pro mensual/i })).toBeEnabled()
    expect(screen.getByRole("button", { name: /Elegir Pro anual/i })).toBeEnabled()
    expect(screen.getByText("Recomendado")).toBeInTheDocument()
    expect(screen.getByText("2 meses gratis")).toBeInTheDocument()
  })

  it("Pro mensual active user: Pro mensual is current, Free has no button, Pro anual still offers upgrade (triangulation)", () => {
    render(<PlanCards entitlements={proMonthlyEntitlements} onUpgrade={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Tu plan actual/i })).toBeDisabled()
    expect(screen.queryByRole("button", { name: /Elegir Free/i })).not.toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Elegir Pro anual/i })).toBeEnabled()
  })

  it("clicking 'Elegir Pro mensual' / 'Elegir Pro anual' calls onUpgrade with the matching plan code", async () => {
    const user = userEvent.setup()
    const onUpgrade = vi.fn()
    render(<PlanCards entitlements={freeEntitlements} onUpgrade={onUpgrade} />)

    await user.click(screen.getByRole("button", { name: /Elegir Pro mensual/i }))
    await user.click(screen.getByRole("button", { name: /Elegir Pro anual/i }))

    expect(onUpgrade).toHaveBeenNthCalledWith(1, "pro_monthly")
    expect(onUpgrade).toHaveBeenNthCalledWith(2, "pro_yearly")
  })

  it("disables the upgrade CTAs while loading (triangulation: loading state)", () => {
    render(<PlanCards entitlements={freeEntitlements} onUpgrade={vi.fn()} loading />)

    expect(screen.getByRole("button", { name: /Elegir Pro mensual/i })).toBeDisabled()
    expect(screen.getByRole("button", { name: /Elegir Pro anual/i })).toBeDisabled()
  })

  it("lists the plan features for the Pro cards", () => {
    render(<PlanCards entitlements={freeEntitlements} onUpgrade={vi.fn()} />)

    // Pro sells benefits, not limits: the weekly digest leads the list.
    expect(screen.getAllByText(/Resumen semanal por email/)).toHaveLength(2)
    expect(screen.getAllByText("Clientes y proyectos ilimitados")).toHaveLength(2)
    expect(screen.getAllByText("Soporte prioritario")).toHaveLength(2)
    expect(screen.getByText("3 clientes")).toBeInTheDocument()
  })
})
