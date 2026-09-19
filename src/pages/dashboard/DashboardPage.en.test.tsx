import { afterEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import DashboardPage from "./DashboardPage"
import { renderWithLang } from "../../test/i18n"
import type { AuthState } from "../../features/auth/context/authContext"

let authState: AuthState = { session: null, user: null, status: "anonymous" }

vi.mock("../../features/auth/context/authContext", () => ({
  useAuthState: () => authState,
}))

const getClientsMock = vi.fn()
const getProjectsMock = vi.fn()
const getPaymentsMock = vi.fn()
const getTasksMock = vi.fn()

vi.mock("../../features/clients/services", () => ({ getClients: () => getClientsMock() }))
vi.mock("../../features/projects/services", () => ({ getProjects: () => getProjectsMock() }))
vi.mock("../../features/payments/services", () => ({ getPayments: () => getPaymentsMock() }))
vi.mock("../../features/tasks/services", () => ({ getTasks: () => getTasksMock() }))

afterEach(() => {
  vi.resetAllMocks()
  localStorage.clear()
})

describe("DashboardPage — English", () => {
  it("renders the English labels, greeting and month names when the tree language is en", async () => {
    authState = {
      session: null,
      status: "authenticated",
      user: { user_metadata: { name: "Fausto" } } as unknown as AuthState["user"],
    }
    getClientsMock.mockResolvedValue([{ id: "c1" }])
    getProjectsMock.mockResolvedValue([{ id: "p1", status: "activo" }])
    getPaymentsMock.mockResolvedValue([
      { id: "pay1", amount: 1000, status: "pagado", payment_date: "2026-03-10" },
    ])
    getTasksMock.mockResolvedValue([])

    renderWithLang(
      <Routes>
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>,
      "en",
      { initialEntries: ["/dashboard"] },
    )

    expect(await screen.findByText("Welcome Fausto")).toBeInTheDocument()
    expect(screen.getByText("Receivable")).toBeInTheDocument()
    expect(screen.getByText("Collected this month")).toBeInTheDocument()
    expect(screen.getByText("Active Projects")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Monthly Stats" })).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Upcoming Tasks" })).toBeInTheDocument()
    // The bar chart's axis label derives from the English month name.
    expect(screen.getByText("Mar 26")).toBeInTheDocument()
    expect(screen.queryByText(/Bienvenido/)).not.toBeInTheDocument()
  })
})
