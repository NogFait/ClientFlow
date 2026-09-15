import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, act, waitFor } from "@testing-library/react"
import { useProjectHub } from "./useProjectHub"
import { getSnapshot as getToastSnapshot, _reset as resetToasts } from "../../../components/shared/Toast/toastStore"

const getProjectByIdMock = vi.fn()
const updateProjectStatusMock = vi.fn()
const getTasksByProjectMock = vi.fn()
const updateTaskStatusMock = vi.fn()
const getPaymentsByProjectMock = vi.fn()

vi.mock("../services", () => ({
  getProjectById: (...args: unknown[]) => getProjectByIdMock(...args),
  updateProjectStatus: (...args: unknown[]) => updateProjectStatusMock(...args),
}))

vi.mock("../../tasks/services", () => ({
  getTasksByProject: (...args: unknown[]) => getTasksByProjectMock(...args),
  updateTaskStatus: (...args: unknown[]) => updateTaskStatusMock(...args),
}))

vi.mock("../../payments/services", () => ({
  getPaymentsByProject: (...args: unknown[]) => getPaymentsByProjectMock(...args),
}))

const sampleProject = { id: "p1", name: "Sitio Web", status: "activo" as const, budget: 1000, clientes: { name: "Acme" } }
const sampleTasks = [
  { id: "t1", title: "Diseño", status: "pendiente" as const, priority: "medium" as const, project_id: "p1" },
  { id: "t2", title: "Deploy", status: "hechas" as const, priority: "high" as const, project_id: "p1" },
]
const samplePayments = [
  { id: "pay1", amount: 300, status: "pagado" as const, method: "efectivo" as const, project_id: "p1" },
]

afterEach(() => {
  getProjectByIdMock.mockReset()
  updateProjectStatusMock.mockReset()
  getTasksByProjectMock.mockReset()
  updateTaskStatusMock.mockReset()
  getPaymentsByProjectMock.mockReset()
  resetToasts()
})

function mockHappyPath() {
  getProjectByIdMock.mockResolvedValue(sampleProject)
  getTasksByProjectMock.mockResolvedValue(sampleTasks)
  getPaymentsByProjectMock.mockResolvedValue(samplePayments)
}

describe("useProjectHub", () => {
  it("loads project, tasks and payments in parallel and computes the summary", async () => {
    mockHappyPath()

    const { result } = renderHook(() => useProjectHub("p1"))

    expect(result.current.loading).toBe(true)

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(getProjectByIdMock).toHaveBeenCalledWith("p1")
    expect(getTasksByProjectMock).toHaveBeenCalledWith("p1")
    expect(getPaymentsByProjectMock).toHaveBeenCalledWith("p1")
    expect(result.current.project).toEqual(sampleProject)
    expect(result.current.tasks).toEqual(sampleTasks)
    expect(result.current.payments).toEqual(samplePayments)
    expect(result.current.notFound).toBe(false)
    expect(result.current.error).toBe(false)
    expect(result.current.summary.paid).toBe(300)
    expect(result.current.summary.tasksDone).toBe(1)
    expect(result.current.summary.tasksTotal).toBe(2)
  })

  it("sets notFound when the project resolves to null (not found or RLS-hidden)", async () => {
    getProjectByIdMock.mockResolvedValue(null)
    getTasksByProjectMock.mockResolvedValue([])
    getPaymentsByProjectMock.mockResolvedValue([])

    const { result } = renderHook(() => useProjectHub("missing"))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.notFound).toBe(true)
    expect(result.current.error).toBe(false)
  })

  it("sets error when any of the three queries rejects (triangulation: different failure mode)", async () => {
    getProjectByIdMock.mockResolvedValue(sampleProject)
    getTasksByProjectMock.mockRejectedValue(new Error("boom"))
    getPaymentsByProjectMock.mockResolvedValue([])

    const { result } = renderHook(() => useProjectHub("p1"))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.error).toBe(true)
    expect(result.current.notFound).toBe(false)
  })

  it("refresh() re-runs the three queries", async () => {
    mockHappyPath()
    const { result } = renderHook(() => useProjectHub("p1"))
    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(getProjectByIdMock).toHaveBeenCalledTimes(1)

    act(() => {
      result.current.refresh()
    })

    await waitFor(() => expect(getProjectByIdMock).toHaveBeenCalledTimes(2))
  })

  describe("toggleTaskDone", () => {
    it("optimistically flips pendiente -> hechas and calls updateTaskStatus", async () => {
      mockHappyPath()
      updateTaskStatusMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectHub("p1"))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.toggleTaskDone(result.current.tasks[0])
      })

      expect(updateTaskStatusMock).toHaveBeenCalledWith("t1", "hechas")
      expect(result.current.tasks.find((t) => t.id === "t1")?.status).toBe("hechas")
    })

    it("flips hechas -> pendiente (triangulation: opposite direction)", async () => {
      mockHappyPath()
      updateTaskStatusMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectHub("p1"))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.toggleTaskDone(result.current.tasks[1])
      })

      expect(updateTaskStatusMock).toHaveBeenCalledWith("t2", "pendiente")
      expect(result.current.tasks.find((t) => t.id === "t2")?.status).toBe("pendiente")
    })

    it("rolls back the optimistic update and shows an error toast when updateTaskStatus fails", async () => {
      mockHappyPath()
      updateTaskStatusMock.mockRejectedValue(new Error("boom"))
      const { result } = renderHook(() => useProjectHub("p1"))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.toggleTaskDone(result.current.tasks[0])
      })

      expect(result.current.tasks.find((t) => t.id === "t1")?.status).toBe("pendiente")
      expect(getToastSnapshot().some((t) => t.variant === "error")).toBe(true)
    })
  })

  describe("setStatus", () => {
    it("calls updateProjectStatus and refreshes", async () => {
      mockHappyPath()
      updateProjectStatusMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectHub("p1"))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.setStatus("pausado")
      })

      expect(updateProjectStatusMock).toHaveBeenCalledWith("p1", "pausado")
      await waitFor(() => expect(getProjectByIdMock).toHaveBeenCalledTimes(2))
    })

    it("warns with a toast when marking completo while tasks are still pending, but still applies the change", async () => {
      mockHappyPath()
      updateProjectStatusMock.mockResolvedValue(undefined)
      const { result } = renderHook(() => useProjectHub("p1"))
      await waitFor(() => expect(result.current.loading).toBe(false))

      await act(async () => {
        await result.current.setStatus("completo")
      })

      expect(updateProjectStatusMock).toHaveBeenCalledWith("p1", "completo")
      expect(getToastSnapshot().some((t) => t.message.includes("1 tareas pendientes"))).toBe(true)
    })
  })
})
