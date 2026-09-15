import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ProjectsPage from "./ProjectsPage"
import { LimitExceededError } from "../../features/billing/domain/errors"
import type { Entitlements } from "../../features/billing/types"
import { ToastProvider } from "../../components/shared/Toast/ToastProvider"
import { formatCurrency } from "../../utils/currency"

// getByText's default normalizer collapses the NBSP formatCurrency puts
// between "$" and the digits down to a regular space before comparing.
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

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
const deleteProjectMock = vi.fn()
const getClientsMock = vi.fn()
const getPaymentsMock = vi.fn()

vi.mock("../../features/projects/services", () => ({
  getProjects: () => getProjectsMock(),
  createProject: (project: unknown) => createProjectMock(project),
  updateProject: vi.fn(),
  deleteProject: (id: string) => deleteProjectMock(id),
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
  deleteProjectMock.mockReset()
  getClientsMock.mockReset()
  getPaymentsMock.mockReset()
  refreshEntitlementsMock.mockReset()
})

const sampleProject = {
  id: "p1",
  name: "Sitio Web",
  status: "activo" as const,
  clientes: { name: "Acme" },
}

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

    await waitFor(() => expect(screen.getByText(/Todavía no tenés proyectos/i)).toBeInTheDocument())
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

    await waitFor(() => expect(screen.getByText(/Todavía no tenés proyectos/i)).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /nuevo proyecto/i }))
    await user.type(container.querySelector("form input")!, "Proyecto Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))
    await screen.findByText(/alcanzaste el límite de tu plan/i)

    await user.click(screen.getByRole("button", { name: /anual/i }))

    expect(await screen.findByText("Billing Settings Mock")).toBeInTheDocument()
  })
})

describe("ProjectsPage — empty state", () => {
  it("shows the EmptyState explanation and CTA when there are no projects, and the CTA opens the same create modal as the header action", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])

    renderProjectsPage()

    expect(await screen.findByText("Todavía no tenés proyectos")).toBeInTheDocument()
    expect(
      screen.getByText("Un proyecto agrupa tareas y pagos de un cliente."),
    ).toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Crear primer proyecto" }))

    expect(await screen.findByRole("heading", { name: "Nuevo Proyecto" })).toBeInTheDocument()
  })
})

describe("ProjectsPage — toast feedback", () => {
  it("shows a success toast after creating a project", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])
    createProjectMock.mockResolvedValue(undefined)

    const { container } = render(
      <MemoryRouter initialEntries={["/projects"]}>
        <ToastProvider>
          <Routes>
            <Route path="/projects" element={<ProjectsPage />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>,
    )

    await waitFor(() => expect(screen.getByText("Todavía no tenés proyectos")).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /nuevo proyecto/i }))
    await user.type(container.querySelector("form input")!, "Proyecto Nuevo")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText("Proyecto guardado")).toBeInTheDocument()
  })
})

describe("ProjectsPage — currency formatting (es-AR)", () => {
  it("renders 'Ingreso Mensual' and a project's budget through the shared es-AR formatter", async () => {
    const projectWithBudget = { ...sampleProject, budget: 750000 }
    const thisMonth = new Date()
    getProjectsMock.mockResolvedValue([projectWithBudget])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([
      { id: "pay1", amount: 120000, status: "pagado", payment_date: thisMonth.toISOString().split("T")[0] },
    ])

    renderProjectsPage()

    await waitFor(() => expect(screen.getByText("Ingreso Mensual")).toBeInTheDocument())
    expect(screen.getByText(money(120000))).toBeInTheDocument()
    expect(screen.getByText(money(750000))).toBeInTheDocument()
  })
})

describe("ProjectsPage — delete confirmation", () => {
  it("opens a confirm dialog when Eliminar is clicked and does not delete until confirmed", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([sampleProject])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])

    renderProjectsPage()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText('¿Eliminar el proyecto "Sitio Web"?')).toBeInTheDocument()
    expect(deleteProjectMock).not.toHaveBeenCalled()
  })

  it("calls deleteProject when the dialog is confirmed", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([sampleProject])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])
    deleteProjectMock.mockResolvedValue(undefined)

    renderProjectsPage()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deleteProjectMock).toHaveBeenCalledWith("p1"))
  })

  it("does NOT call deleteProject when the dialog is cancelled (triangulation)", async () => {
    const user = userEvent.setup()
    getProjectsMock.mockResolvedValue([sampleProject])
    getClientsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])

    renderProjectsPage()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(deleteProjectMock).not.toHaveBeenCalled()
  })
})
