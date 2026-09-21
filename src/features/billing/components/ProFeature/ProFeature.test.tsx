import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ProFeature from "./ProFeature"
import type { Entitlements } from "../../types"

let entitlements: Entitlements | null = null
vi.mock("../../context/entitlementsContext", () => ({
  useEntitlementsContext: () => ({ entitlements, refresh: vi.fn(), loading: false }),
}))

const base: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 0, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

function renderGate() {
  return render(
    <MemoryRouter initialEntries={["/clients"]}>
      <Routes>
        <Route
          path="/clients"
          element={
            <ProFeature title="¿Quién te deja más plata?" description="Cobrado y pendiente por cliente.">
              <div data-testid="pro-content">contenido pro</div>
            </ProFeature>
          }
        />
        <Route path="/settings/billing" element={<div data-testid="billing-page">billing</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  entitlements = null
})

describe("ProFeature", () => {
  it("renders the children for a Pro user (monthly or yearly)", () => {
    entitlements = { ...base, plan: "pro_monthly", status: "active", limits: { clientes: null, proyectos: null } }
    renderGate()

    expect(screen.getByTestId("pro-content")).toBeInTheDocument()
    expect(screen.queryByText(/Ver planes/i)).not.toBeInTheDocument()
  })

  it("shows the feature as locked (title, description, Pro tag, no content) for a Free user", () => {
    entitlements = base
    renderGate()

    expect(screen.queryByTestId("pro-content")).not.toBeInTheDocument()
    expect(screen.getByText("¿Quién te deja más plata?")).toBeInTheDocument()
    expect(screen.getByText("Cobrado y pendiente por cliente.")).toBeInTheDocument()
    expect(screen.getByText("Pro")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /Ver planes/i })).toBeInTheDocument()
  })

  it("takes the Free user to billing settings from the locked card", async () => {
    entitlements = base
    const user = userEvent.setup()
    renderGate()

    await user.click(screen.getByRole("button", { name: /Ver planes/i }))

    expect(await screen.findByTestId("billing-page")).toBeInTheDocument()
  })

  it("stays locked while entitlements have not loaded (never flashes Pro content to a Free user)", () => {
    entitlements = null
    renderGate()

    expect(screen.queryByTestId("pro-content")).not.toBeInTheDocument()
    expect(screen.getByText("Pro")).toBeInTheDocument()
  })
})

describe("ProFeature — inline variant (toolbar buttons)", () => {
  it("renders a single locked button with the title and Pro tag for a Free user, which leads to billing", async () => {
    entitlements = base
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={["/payments"]}>
        <Routes>
          <Route
            path="/payments"
            element={
              <ProFeature variant="inline" title="Exportar a Excel" description="CSV del mes o del año.">
                <button type="button">Exportar mes</button>
              </ProFeature>
            }
          />
          <Route path="/settings/billing" element={<div data-testid="billing-page">billing</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.queryByRole("button", { name: "Exportar mes" })).not.toBeInTheDocument()
    const locked = screen.getByRole("button", { name: /Exportar a Excel/i })
    expect(locked).toHaveAttribute("title", "CSV del mes o del año.")
    expect(locked.textContent).toContain("Pro")
    await user.click(locked)
    expect(await screen.findByTestId("billing-page")).toBeInTheDocument()
  })
})
