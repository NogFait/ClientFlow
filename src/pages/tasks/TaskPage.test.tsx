import { afterEach, describe, expect, it, vi } from "vitest"
import { render, screen, waitFor, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import TaskPage from "./TaskPage"

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
