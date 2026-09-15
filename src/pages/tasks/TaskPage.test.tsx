import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskPage from "./TaskPage"
import { ToastProvider } from "../../components/shared/Toast/ToastProvider"

const getTasksMock = vi.fn()
const deleteTaskMock = vi.fn()
const getProjectsMock = vi.fn()

vi.mock("../../features/tasks/services", () => ({
  getTasks: () => getTasksMock(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  deleteTask: (id: string) => deleteTaskMock(id),
}))

vi.mock("../../features/projects/services", () => ({
  getProjects: () => getProjectsMock(),
}))

afterEach(() => {
  getTasksMock.mockReset()
  deleteTaskMock.mockReset()
  getProjectsMock.mockReset()
})

const sampleTask = {
  id: "t1",
  title: "Escribir propuesta",
  status: "pendiente" as const,
  priority: "medium" as const,
}

describe("TaskPage — empty board state", () => {
  it("shows one EmptyState with a CTA (not three 'Sin tareas' columns) when there are zero tasks total", async () => {
    const user = userEvent.setup()
    getTasksMock.mockResolvedValue([])
    getProjectsMock.mockResolvedValue([])

    render(<TaskPage />)

    expect(await screen.findByText("Todavía no tenés tareas")).toBeInTheDocument()
    expect(
      screen.getByText("Organizá el trabajo de tus proyectos en Pendiente, En progreso y Hechas."),
    ).toBeInTheDocument()
    expect(screen.queryByText("Sin tareas")).not.toBeInTheDocument()

    await user.click(screen.getByRole("button", { name: "Crear primera tarea" }))

    expect(await screen.findByRole("heading", { name: "Nueva Tarea" })).toBeInTheDocument()
  })

  it("keeps a subtle per-column 'Sin tareas' (no CTA, no big EmptyState) when some tasks exist but a column is empty (triangulation)", async () => {
    getTasksMock.mockResolvedValue([sampleTask])
    getProjectsMock.mockResolvedValue([])

    render(<TaskPage />)

    await screen.findByText("Escribir propuesta")
    expect(screen.queryByText("Todavía no tenés tareas")).not.toBeInTheDocument()
    // "pendiente" holds the sample task; "en_progreso" and "hechas" are empty
    // columns and should keep the small inline message, not the big CTA.
    const sinTareas = screen.getAllByText("Sin tareas")
    expect(sinTareas).toHaveLength(2)
    expect(screen.queryByRole("button", { name: "Crear primera tarea" })).not.toBeInTheDocument()
  })
})

describe("TaskPage — toast feedback", () => {
  it("shows a success toast after creating a task", async () => {
    const user = userEvent.setup()
    getTasksMock.mockResolvedValue([])
    getProjectsMock.mockResolvedValue([])
    const { createTask } = await import("../../features/tasks/services")
    vi.mocked(createTask).mockResolvedValue(undefined)

    const { container } = render(
      <ToastProvider>
        <TaskPage />
      </ToastProvider>,
    )

    await waitFor(() => expect(screen.getByText("Todavía no tenés tareas")).toBeInTheDocument())
    await user.click(screen.getByRole("button", { name: /crear tarea/i }))
    await user.type(container.querySelector("form input")!, "Tarea Nueva")
    await user.click(screen.getByRole("button", { name: /guardar/i }))

    expect(await screen.findByText("Tarea guardada")).toBeInTheDocument()
  })
})

describe("TaskPage — delete confirmation", () => {
  it("opens a confirm dialog (not window.confirm) when Eliminar is clicked and does not delete until confirmed", async () => {
    const user = userEvent.setup()
    getTasksMock.mockResolvedValue([sampleTask])
    getProjectsMock.mockResolvedValue([])

    render(<TaskPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))

    expect(await screen.findByRole("dialog")).toBeInTheDocument()
    expect(screen.getByText('¿Eliminar "Escribir propuesta"?')).toBeInTheDocument()
    expect(deleteTaskMock).not.toHaveBeenCalled()
  })

  it("calls deleteTask when the dialog is confirmed", async () => {
    const user = userEvent.setup()
    getTasksMock.mockResolvedValue([sampleTask])
    getProjectsMock.mockResolvedValue([])
    deleteTaskMock.mockResolvedValue(undefined)

    render(<TaskPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Eliminar" }))

    await waitFor(() => expect(deleteTaskMock).toHaveBeenCalledWith("t1"))
  })

  it("does NOT call deleteTask when the dialog is cancelled (triangulation)", async () => {
    const user = userEvent.setup()
    getTasksMock.mockResolvedValue([sampleTask])
    getProjectsMock.mockResolvedValue([])

    render(<TaskPage />)

    await user.click(await screen.findByRole("button", { name: /eliminar/i }))
    const dialog = await screen.findByRole("dialog")
    await user.click(within(dialog).getByRole("button", { name: "Cancelar" }))

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
    expect(deleteTaskMock).not.toHaveBeenCalled()
  })
})
