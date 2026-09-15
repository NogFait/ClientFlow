import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ProjectsPage from "./ProjectsPage"
import { LimitExceededError } from "../../features/billing/domain/errors"
import type { Entitlements } from "../../features/billing/types"

function renderProjectsPage() {
  return render(
    <MemoryRouter initialEntries={["/projects"]}>
      <Routes>
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/settings/billing" element={<div>Billing Settings Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

const getProjectsMock = vi.fn()
const createProjectMock = vi.fn()
const getClientsMock = vi.fn()
const getPaymentsMock = vi.fn()

vi.mock("../../features/projects/services", () => ({
  getProjects: () => getProjectsMock(),
  createProject: (project: unknown) => createProjectMock(project),
  updateProject: vi.fn(),
  deleteProject: vi.fn(),
}))

vi.mock("../../features/clients/services", () => ({
  getClients: () => getClientsMock(),
}))

vi.mock("../../features/payments/services", () => ({
  getPayments: () => getPaymentsMock(),
}))

const freeEntitlementsUnderLimit: Entitlements = {
  plan: "free",
  status: "free",
  limits: { clientes: 3, proyectos: 5 },
  usage: { clientes: 0, proyectos: 0 },
  current_period_end: null,
  cancel_at_period_end: false,
  grace_until: null,
}

const refreshEntitlementsMock = vi.fn()

vi.mock("../../features/billing/context/entitlementsContext", () => ({
  useEntitlementsContext: () => ({
    entitlements: freeEntitlementsUnderLimit,
    refresh: refreshEntitlementsMock,
    loading: false,
  }),
}))

afterEach(() => {
  getProjectsMock.mockReset()
  createProjectMock.mockReset()
  getClientsMock.mockReset()
  getPaymentsMock.mockReset()
  refreshEntitlementsMock.mockReset()
})

describe("ProjectsPage — upgrade CTA navigation", () => {
  it("navigates to /settings/billing when the UpgradePrompt CTA is clicked after a LIMIT_EXCEEDED", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])
    createProjectMock.mockRejectedValue(
      new LimitExceededError({ resource: "proyectos", limit: 5, current: 5, plan: "free" }),
    )

    const { container } = renderProjectsPage()

    await waitFor(() => expect(screen.getByText(/no hay proyectos registrados/i)).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /nuevo proyecto/i }))
    await user.type(container.querySelector("form input")!, "Proyecto Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))
    await screen.findByText(/alcanzaste el límite de tu plan/i)

    await user.click(screen.getByRole("button", { name: /mensual/i }))

    expect(await screen.findByText("Billing Settings Mock")).toBeInTheDocument()
  })

  it("navigates to /settings/billing when the yearly CTA is clicked (triangulation: different button)", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])
    createProjectMock.mockRejectedValue(
      new LimitExceededError({ resource: "proyectos", limit: 5, current: 5, plan: "free" }),
    )

    const { container } = renderProjectsPage()

    await waitFor(() => expect(screen.getByText(/no hay proyectos registrados/i)).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /nuevo proyecto/i }))
    await user.type(container.querySelector("form input")!, "Proyecto Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))
    await screen.findByText(/alcanzaste el límite de tu plan/i)

    await user.click(screen.getByRole("button", { name: /anual/i }))

    expect(await screen.findByText("Billing Settings Mock")).toBeInTheDocument()
  })
})
