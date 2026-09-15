import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import DashboardPage from "./DashboardPage"
import { formatCurrency } from "../../utils/currency"

// getByText's default normalizer collapses the NBSP formatCurrency puts
// between "$" and the digits down to a regular space before comparing (see
// the same note in PaymentsPage.test.tsx) — match against that form.
const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

const getUserMock = vi.fn()
const getClientsMock = vi.fn()
const getProjectsMock = vi.fn()
const getPaymentsMock = vi.fn()
const getTasksMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: () => getUserMock(),
    },
  },
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
        <Route path="/payments" element={<div>Payments Page Mock</div>} />
        <Route path="/tasks" element={<div>Tasks Page Mock</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  getUserMock.mockReset()
  getClientsMock.mockReset()
  getProjectsMock.mockReset()
  getPaymentsMock.mockReset()
  getTasksMock.mockReset()
})

const noSessionResolvers = () => {
  getClientsMock.mockResolvedValue([])
  getProjectsMock.mockResolvedValue([])
  getPaymentsMock.mockResolvedValue([])
  getTasksMock.mockResolvedValue([])
}

describe("DashboardPage — welcome message", () => {
  it("greets the user by their Supabase user_metadata name", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "fausto@example.com", user_metadata: { name: "Fausto" } } } })
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("Bienvenido Fausto")).toBeInTheDocument()
  })

  it("falls back to the email local-part when there is no name (triangulation)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { email: "maria.lopez@example.com", user_metadata: {} } } })
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("Bienvenido maria.lopez")).toBeInTheDocument()
  })
})

describe("DashboardPage — Estadísticas Mensuales empty state", () => {
  it("shows an EmptyState with a CTA that navigates to /payments when there are no paid payments", async () => {
    const user = userEvent.setup()
    getUserMock.mockResolvedValue({ data: { user: null } })
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
    getUserMock.mockResolvedValue({ data: { user: null } })
    noSessionResolvers()

    renderDashboard()

    expect(await screen.findByText("No hay tareas pendientes con fecha")).toBeInTheDocument()
    await user.click(screen.getByRole("button", { name: "Ver tareas" }))

    expect(await screen.findByText("Tasks Page Mock")).toBeInTheDocument()
  })
})

describe("DashboardPage — currency formatting (es-AR)", () => {
  it("renders 'Ingreso Mensual' through the shared es-AR formatter", async () => {
    getUserMock.mockResolvedValue({ data: { user: null } })
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

    await waitFor(() => expect(screen.getByText("Ingreso Mensual")).toBeInTheDocument())
    expect(screen.getByText(money(2500))).toBeInTheDocument()
  })
})
