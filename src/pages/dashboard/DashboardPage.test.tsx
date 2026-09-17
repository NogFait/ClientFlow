import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import DashboardPage from "./DashboardPage"
import { formatCurrency } from "../../utils/currency"
import type { AuthState } from "../../features/auth/context/authContext"

// getByText's default normalizer collapses the NBSP formatCurrency puts
// between "$" and the digits down to a regular space before comparing (see
// the same note in PaymentsPage.test.tsx) — match against that form.
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

const getClientsMock = vi.fn()
const getProjectsMock = vi.fn()
const getPaymentsMock = vi.fn()
const getTasksMock = vi.fn()

let authState: AuthState

vi.mock("../../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
}))

vi.mock("../../features/clients/services", () => ({
  getClients: () => getClientsMock(),
}))

vi.mock("../../features/projects/services", () => ({
  getProjects: () => getProjectsMock(),
}))

vi.mock("../../features/payments/services", () => ({
  getPayments: () => getPaymentsMock(),
}))

vi.mock("../../features/tasks/services", () => ({
  getTasks: () => getTasksMock(),
}))

function renderDashboard() {
  return render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<div>Clients Page Mock</div>} />
        <Route path="/projects" element={<div>Projects Page Mock</div>} />
        <Route path="/payments" element={<div>Payments Page Mock</div>} />
        <Route path="/tasks" element={<div>Tasks Page Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  getClientsMock.mockReset()
  getProjectsMock.mockReset()
  getPaymentsMock.mockReset()
  getTasksMock.mockReset()
  localStorage.clear()
})

const anonymousAuthState: AuthState = { session: null, user: null, status: "anonymous" }

const noSessionResolvers = () => {
  getClientsMock.mockResolvedValue([])
  getProjectsMock.mockResolvedValue([])
  getPaymentsMock.mockResolvedValue([])
  getTasksMock.mockResolvedValue([])
}

describe("DashboardPage — welcome message", () => {
  it("greets the user by their Supabase user_metadata name", async () => {
    authState = {
      session: null,
      user: { email: "fausto@example.com", user_metadata: { name: "Fausto" } } as never,
      status: "authenticated",
    }
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("Bienvenido Fausto")).toBeInTheDocument()
  })

  it("falls back to the email local-part when there is no name (triangulation)", async () => {
    authState = {
      session: null,
      user: { email: "maria.lopez@example.com", user_metadata: {} } as never,
      status: "authenticated",
    }
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("Bienvenido maria.lopez")).toBeInTheDocument()
  })
})

describe("DashboardPage — Estadísticas Mensuales empty state", () => {
  it("shows an EmptyState with a CTA that navigates to /payments when there are no paid payments", async () => {
    const user = userEvent.setup()
    authState = anonymousAuthState
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("Aún no hay cobros registrados")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Registrar pago" }))

    expect(await screen.findByText("Payments Page Mock")).toBeInTheDocument()
  })
})

describe("DashboardPage — Próximas Tareas empty state", () => {
  it("shows an EmptyState with a CTA that navigates to /tasks when there are no tasks with a due date", async () => {
    const user = userEvent.setup()
    authState = anonymousAuthState
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("No hay tareas pendientes con fecha")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Ver tareas" }))

    expect(await screen.findByText("Tasks Page Mock")).toBeInTheDocument()
  })
})

describe("DashboardPage — currency formatting (es-AR)", () => {
  it("renders 'Ingreso Mensual' through the shared es-AR formatter", async () => {
    authState = anonymousAuthState
    getClientsMock.mockResolvedValue([])
    getProjectsMock.mockResolvedValue([])
    getTasksMock.mockResolvedValue([])
    const thisMonth = new Date()
    getPaymentsMock.mockResolvedValue([
      {
        id: "pay1",
        amount: 2500,
        status: "pagado",
        payment_date: thisMonth.toISOString().split("T")[0],
      },
    ])

    renderDashboard()

    await waitFor(() => expect(screen.getByText("Cobrado este mes")).toBeInTheDocument())
    expect(screen.getByText(money(2500))).toBeInTheDocument()
  })
})

describe("DashboardPage — answers 'cuánto me falta cobrar' and 'qué tengo que hacer'", () => {
  it("shows the receivable total with the overdue part, and tasks due today / overdue", async () => {
    authState = anonymousAuthState
    getClientsMock.mockResolvedValue([{ id: "c1" }])
    getProjectsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([
      { id: "p1", amount: 300, status: "pendiente", payment_date: "2000-01-01" }, // overdue
      { id: "p2", amount: 200, status: "pendiente", payment_date: "2999-01-01" }, // upcoming
    ])
    getTasksMock.mockResolvedValue([
      { id: "t1", title: "Vieja", status: "pendiente", priority: "high", due_date: "2000-01-01" },
      { id: "t2", title: "Futura", status: "pendiente", priority: "low", due_date: "2999-01-01" },
    ])

    renderDashboard()

    await waitFor(() => expect(screen.getByText("Por cobrar")).toBeInTheDocument())
    expect(screen.getByText(money(500))).toBeInTheDocument()
    expect(screen.getByText(`${money(300)} vencido`)).toBeInTheDocument()
    expect(screen.getByText("Vencidas")).toBeInTheDocument()
    expect(screen.getByText("Cobrado este mes")).toBeInTheDocument()
    expect(screen.queryByText("Total clientes")).not.toBeInTheDocument()
  })
})

describe("DashboardPage — onboarding checklist (task 3.11)", () => {
  it("shows the onboarding card when the user has 0 clients and 0 projects", async () => {
    authState = anonymousAuthState
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("Empezá en 3 pasos")).toBeInTheDocument()
  })

  it("does not show the onboarding card once the user has at least one client (triangulation)", async () => {
    authState = anonymousAuthState
    getClientsMock.mockResolvedValue([{ id: "c1" }])
    getProjectsMock.mockResolvedValue([])
    getPaymentsMock.mockResolvedValue([])
    getTasksMock.mockResolvedValue([])

    renderDashboard()

    await waitFor(() => expect(screen.getByText("Por cobrar")).toBeInTheDocument())
    expect(screen.queryByText("Empezá en 3 pasos")).not.toBeInTheDocument()
  })
})
