import { describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import BillingSettings from "./BillingSettings"
import type { Entitlements } from "../../types"

const freeEntitlements: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 2, proyectos: 5 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

const activeProEntitlements: Entitlements = {
  plan: "pro_monthly",
  status: "active",
  limits: { clientes: null, proyectos: null },
  usage: { clientes: 40, proyectos: 12 },
  current_period_end: "2026-11-01T00:00:00.000Z",
  cancel_at_period_end: false,
  grace_until: null,
}

const scheduledCancelEntitlements: Entitlements = {
  ...activeProEntitlements,
  cancel_at_period_end: true,
}

const pastDueEntitlements: Entitlements = {
  plan: "pro_yearly",
  status: "past_due",
  limits: { clientes: null, proyectos: null },
  usage: { clientes: 10, proyectos: 3 },
  current_period_end: "2026-09-01T00:00:00.000Z",
  cancel_at_period_end: false,
  grace_until: "2026-09-21T00:00:00.000Z",
}

const canceledEntitlements: Entitlements = {
  ...freeEntitlements,
  plan: "pro_monthly",
  status: "canceled",
}

describe("BillingSettings — current plan panel", () => {
  it("Free user sees 'Plan gratuito', usage meters, and no manage/reactivate buttons", () => {
    render(<BillingSettings entitlements={freeEntitlements} onUpgrade={vi.fn()} onManage={vi.fn()} />)

    expect(screen.getByText("Free", { selector: "span" })).toBeInTheDocument()
    expect(screen.getByText("Plan gratuito")).toBeInTheDocument()
    expect(screen.getByText("2 / 3")).toBeInTheDocument()
    expect(screen.getByText("5 / 5")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Gestionar suscripción/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Reactivar suscripción/i })).not.toBeInTheDocument()
  })

  it("Active Pro user (no scheduled cancel) sees the renewal date and a single 'Gestionar suscripción' button (triangulation)", () => {
    render(<BillingSettings entitlements={activeProEntitlements} onUpgrade={vi.fn()} onManage={vi.fn()} />)

    expect(screen.getByText(/Activo · se renueva el/)).toBeInTheDocument()
    expect(screen.getByText(/1 de noviembre de 2026/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Gestionar suscripción/i })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Reactivar suscripción/i })).not.toBeInTheDocument()
  })

  it("Active Pro with cancel_at_period_end shows the reactivate CTA plus a secondary manage button (fixes the reactivation gap)", () => {
    render(<BillingSettings entitlements={scheduledCancelEntitlements} onUpgrade={vi.fn()} onManage={vi.fn()} />)

    expect(screen.getByText(/Termina el .* podés reactivarlo cuando quieras/)).toBeInTheDocument()
    expect(screen.getByText(/1 de noviembre de 2026/i)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Reactivar suscripción/i })).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Gestionar suscripción/i })).toBeInTheDocument()
  })

  it("past_due user sees the grace deadline status line and a manage button (triangulation)", () => {
    render(<BillingSettings entitlements={pastDueEntitlements} onUpgrade={vi.fn()} onManage={vi.fn()} />)

    expect(screen.getByText(/Pago pendiente · acceso Pro hasta/)).toBeInTheDocument()
    expect(screen.getByText(/21 de septiembre de 2026/i)).toBeInTheDocument()
    expect(screen.getByText(/10 — ilimitado/)).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Gestionar suscripción/i })).toBeInTheDocument()
  })

  it("canceled (terminal) user sees 'Sin suscripción activa' and no manage/reactivate button (triangulation)", () => {
    render(<BillingSettings entitlements={canceledEntitlements} onUpgrade={vi.fn()} onManage={vi.fn()} />)

    expect(screen.getByText("Sin suscripción activa")).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Gestionar suscripción/i })).not.toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /Reactivar suscripción/i })).not.toBeInTheDocument()
  })

  it("clicking 'Gestionar suscripción' or 'Reactivar suscripción' calls onManage", async () => {
    const user = userEvent.setup()
    const onManage = vi.fn()
    render(<BillingSettings entitlements={scheduledCancelEntitlements} onUpgrade={vi.fn()} onManage={onManage} />)

    await user.click(screen.getByRole("button", { name: /Reactivar suscripción/i }))
    await user.click(screen.getByRole("button", { name: /Gestionar suscripción/i }))

    expect(onManage).toHaveBeenCalledTimes(2)
  })

  it("shows the error message when provided (e.g. checkout failed)", () => {
    render(
      <BillingSettings
        entitlements={freeEntitlements}
        onUpgrade={vi.fn()}
        onManage={vi.fn()}
        error="Ya tenés una suscripción Pro activa."
      />,
    )

    expect(screen.getByRole("alert")).toHaveTextContent("Ya tenés una suscripción Pro activa.")
  })
})

describe("BillingSettings — plan cards composition", () => {
  it("renders the plan cards below the panel and forwards onUpgrade clicks", async () => {
    const user = userEvent.setup()
    const onUpgrade = vi.fn()
    render(<BillingSettings entitlements={freeEntitlements} onUpgrade={onUpgrade} onManage={vi.fn()} />)

    expect(screen.getByRole("button", { name: /Elegir Pro mensual/i })).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: /Elegir Pro anual/i }))

    expect(onUpgrade).toHaveBeenCalledWith("pro_yearly")
  })
})
