import { afterEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import ProjectHubPage from "./ProjectHubPage"
import { renderWithLang } from "../../../test/i18n"

const getProjectByIdMock = vi.fn()
const getTasksByProjectMock = vi.fn()
const getPaymentsByProjectMock = vi.fn()

vi.mock("../../../features/projects/services", () => ({
  getProjectById: (...args: unknown[]) => getProjectByIdMock(...args),
  updateProjectStatus: vi.fn(),
  deleteProject: vi.fn(),
  countPaymentsByProject: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
}))

vi.mock("../../../features/tasks/services", () => ({
  getTasksByProject: (...args: unknown[]) => getTasksByProjectMock(...args),
  updateTaskStatus: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
}))

vi.mock("../../../features/payments/services", () => ({
  getPaymentsByProject: (...args: unknown[]) => getPaymentsByProjectMock(...args),
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
}))

vi.mock("../../../features/clients/services", () => ({
  getClients: () => Promise.resolve([]),
}))

afterEach(() => {
  getProjectByIdMock.mockReset()
  getTasksByProjectMock.mockReset()
  getPaymentsByProjectMock.mockReset()
})

function renderHub() {
  return renderWithLang(
    <Routes>
      <Route path="/projects/:id" element={<ProjectHubPage />} />
    </Routes>,
    "en",
    { initialEntries: ["/projects/p1"] },
  )
}

describe("ProjectHubPage — English", () => {
  it("renders stats, sections, status/priority/method labels and dates in English", async () => {
    getProjectByIdMock.mockResolvedValue({
      id: "p1",
      name: "Sitio Web",
      status: "activo",
      budget: 1000,
      start_date: "2026-01-01",
      end_date: "2026-06-01",
      clientes: { name: "Acme" },
    })
    getTasksByProjectMock.mockResolvedValue([
      { id: "t1", title: "Diseño", status: "pendiente", priority: "high", project_id: "p1", due_date: "2026-02-15" },
    ])
    getPaymentsByProjectMock.mockResolvedValue([
      { id: "pay1", amount: 300, status: "pendiente", method: "tarjeta", payment_date: "2026-02-01", project_id: "p1" },
    ])

    renderHub()

    expect(await screen.findByRole("heading", { name: "Sitio Web" })).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Projects" })).toBeInTheDocument()
    expect(screen.getByRole("combobox", { name: "Project status" })).toHaveDisplayValue("Active")
    expect(screen.getByText("Budget")).toBeInTheDocument()
    expect(screen.getByText("Pending collection")).toBeInTheDocument()
    expect(screen.getByText("1 payment(s)")).toBeInTheDocument()
    expect(screen.getByText("0 / 1 done")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: "+ New task" })).toBeInTheDocument()
    expect(screen.getByRole("checkbox", { name: "Mark as done" })).toBeInTheDocument()
    expect(screen.getByText("High")).toBeInTheDocument()
    expect(screen.getByText("Card")).toBeInTheDocument()
    expect(screen.getByText("Pending")).toBeInTheDocument()
    // en-US date; computed because date-only strings parse as UTC midnight.
    // The stored calendar day: the suite runs in UTC-3, where the old
    // new Date("2026-02-01") expectation read as January 31st.
    expect(screen.getByText("2/1/2026")).toBeInTheDocument()
    expect(screen.queryByText("Presupuesto")).not.toBeInTheDocument()
  })

  it("shows the English not-found state (triangulation)", async () => {
    getProjectByIdMock.mockResolvedValue(null)
    getTasksByProjectMock.mockResolvedValue([])
    getPaymentsByProjectMock.mockResolvedValue([])

    renderHub()

    expect(await screen.findByText("Project not found")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: "Back to projects" })).toBeInTheDocument()
  })
})
