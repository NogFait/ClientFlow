import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter, Route, Routes } from "react-router-dom"
import ProjectHubPage from "./ProjectHubPage"
import { ToastProvider } from "../../../components/shared/Toast/ToastProvider"
import { formatCurrency } from "../../../utils/currency"

const money = (amount: number) => formatCurrency(amount).replace(/\u00A0/g, " ")

const getProjectByIdMock = vi.fn()
const updateProjectStatusMock = vi.fn()
const deleteProjectMock = vi.fn()
const countPaymentsByProjectMock = vi.fn()
const getTasksByProjectMock = vi.fn()
const updateTaskStatusMock = vi.fn()
const getPaymentsByProjectMock = vi.fn()
const getClientsMock = vi.fn()

vi.mock("../../../features/projects/services", () => ({
  getProjectById: (...args: unknown[]) => getProjectByIdMock(...args),
  updateProjectStatus: (...args: unknown[]) => updateProjectStatusMock(...args),
  deleteProject: (...args: unknown[]) => deleteProjectMock(...args),
  countPaymentsByProject: (...args: unknown[]) => countPaymentsByProjectMock(...args),
  createProject: vi.fn(),
  updateProject: vi.fn(),
}))

vi.mock("../../../features/tasks/services", () => ({
  getTasksByProject: (...args: unknown[]) => getTasksByProjectMock(...args),
  updateTaskStatus: (...args: unknown[]) => updateTaskStatusMock(...args),
  createTask: vi.fn(),
  updateTask: vi.fn(),
}))

vi.mock("../../../features/payments/services", () => ({
  getPaymentsByProject: (...args: unknown[]) => getPaymentsByProjectMock(...args),
  createPayment: vi.fn(),
  updatePayment: vi.fn(),
}))

vi.mock("../../../features/clients/services", () => ({
  getClients: (...args: unknown[]) => getClientsMock(...args),
}))

afterEach(() => {
  getProjectByIdMock.mockReset()
  updateProjectStatusMock.mockReset()
  deleteProjectMock.mockReset()
  countPaymentsByProjectMock.mockReset()
  getTasksByProjectMock.mockReset()
  updateTaskStatusMock.mockReset()
  getPaymentsByProjectMock.mockReset()
  getClientsMock.mockReset()
})

const sampleProject = {
  id: "p1",
  name: "Sitio Web",
  status: "activo" as const,
  budget: 1000,
  start_date: "2026-01-01",
  end_date: "2026-06-01",
  clientes: { name: "Acme" },
}

const sampleTasks = [
  { id: "t1", title: "Diseño", status: "pendiente" as const, priority: "medium" as const, project_id: "p1" },
]

const samplePayments = [
  { id: "pay1", amount: 300, status: "pagado" as const, method: "efectivo" as const, payment_date: "2026-02-01", project_id: "p1" },
]

function renderHub(withToast = false) {
  const tree = (
    <MemoryRouter initialEntries={["/projects/p1"]}>
      <Routes>
        <Route path="/projects/:id" element={<ProjectHubPage />} />
        <Route path="/projects" element={<div>Projects List Mock</div>} />
      </Routes>
    </MemoryRouter>
  )
  return render(withToast ? <ToastProvider>{tree}</ToastProvider> : tree)
}

function mockHappyPath() {
  getProjectByIdMock.mockResolvedValue(sampleProject)
  getTasksByProjectMock.mockResolvedValue(sampleTasks)
  getPaymentsByProjectMock.mockResolvedValue(samplePayments)
  getClientsMock.mockResolvedValue([])
}

describe("ProjectHubPage — loaded state", () => {
  it("renders the project name, client name and stats formatted through the shared es-AR formatter", async () => {
    mockHappyPath()

    renderHub()

    expect(await screen.findByRole("heading", { name: "Sitio Web" })).toBeInTheDocument()
    expect(screen.getByText("Acme")).toBeInTheDocument()
    expect(screen.getByText(money(1000))).toBeInTheDocument() // Presupuesto
    // "Cobrado" appears both in the StatCard and the Pagos section footer.
    expect(screen.getAllByText(money(300)).length).toBeGreaterThan(0)
  })
})

describe("ProjectHubPage — not found", () => {
  it("shows a friendly not-found state with a link back to /projects", async () => {
    getProjectByIdMock.mockResolvedValue(null)
    getTasksByProjectMock.mockResolvedValue([])
    getPaymentsByProjectMock.mockResolvedValue([])
    getClientsMock.mockResolvedValue([])

    renderHub()

    expect(await screen.findByText("Proyecto no encontrado")).toBeInTheDocument()
    expect(screen.getByRole("link", { name: /volver a proyectos/i })).toBeInTheDocument()
  })
})

describe("ProjectHubPage — task checkbox", () => {
  it("toggles a pending task to hecha and calls updateTaskStatus", async () => {
    const user = userEvent.setup()
    mockHappyPath()
    updateTaskStatusMock.mockResolvedValue(undefined)

    renderHub()

    const checkbox = await screen.findByRole("checkbox", { name: "Marcar como hecha" })
    await user.click(checkbox)

    await waitFor(() => expect(updateTaskStatusMock).toHaveBeenCalledWith("t1", "hechas"))
    expect(await screen.findByRole("checkbox", { name: "Marcar como pendiente" })).toBeInTheDocument()
  })
})

describe("ProjectHubPage — status select", () => {
  it("calls updateProjectStatus and warns with a toast when marking completo with pending tasks", async () => {
    const user = userEvent.setup()
    mockHappyPath()
    updateProjectStatusMock.mockResolvedValue(undefined)

    renderHub(true)

    const select = await screen.findByLabelText("Estado del proyecto")
    await user.selectOptions(select, "completo")

    await waitFor(() => expect(updateProjectStatusMock).toHaveBeenCalledWith("p1", "completo"))
    expect(await screen.findByText(/quedan 1 tareas pendientes/i)).toBeInTheDocument()
  })
})

describe("ProjectHubPage — delete", () => {
  it("blocks deletion and explains when the project has payments", async () => {
    const user = userEvent.setup()
    mockHappyPath()
    countPaymentsByProjectMock.mockResolvedValue(2)

    renderHub()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByText(/no se puede eliminar/i)).toBeInTheDocument()
    expect(screen.getByText(/tiene 2 pago\(s\) registrado\(s\)/i)).toBeInTheDocument()
    expect(deleteProjectMock).not.toHaveBeenCalled()
  })

  it("deletes and navigates to /projects when there are no payments", async () => {
    const user = userEvent.setup()
    mockHappyPath()
    countPaymentsByProjectMock.mockResolvedValue(0)
    deleteProjectMock.mockResolvedValue(undefined)

    renderHub()

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deleteProjectMock).toHaveBeenCalledWith("p1"))
    expect(await screen.findByText("Projects List Mock")).toBeInTheDocument()
  })
})

describe("ProjectHubPage — nueva tarea", () => {
  it("opens the task form with the project locked (no project select)", async () => {
    const user = userEvent.setup()
    mockHappyPath()

    renderHub()

    await user.click(await screen.findByRole("button", { name: /nueva tarea/i }))

    expect(await screen.findByRole("heading", { name: /nueva tarea/i })).toBeInTheDocument()
    expect(screen.queryByLabelText("Proyecto")).not.toBeInTheDocument()
  })
})
