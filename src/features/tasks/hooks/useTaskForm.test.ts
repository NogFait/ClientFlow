import { afterEach, describe, expect, it, vi } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useTaskForm } from "./useTaskForm"
import type { ITask } from "../types"

const createTaskMock = vi.fn()
const updateTaskMock = vi.fn()

vi.mock("../services", () => ({
  createTask: (...args: unknown[]) => createTaskMock(...args),
  updateTask: (...args: unknown[]) => updateTaskMock(...args),
}))

afterEach(() => {
  createTaskMock.mockReset()
  updateTaskMock.mockReset()
})

const baseTask: ITask = { title: "Diseño", status: "pendiente", priority: "medium" }

describe("useTaskForm — lockedProjectId", () => {
  it("forces project_id to the locked project on create, even when the submitted data omits it", async () => {
    createTaskMock.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useTaskForm(onSuccess, undefined, "p1"))

    await act(async () => {
      await result.current.onSubmit(baseTask)
    })

    expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({ project_id: "p1" }))
  })

  it("forces project_id to the locked project on update too (triangulation: edit path)", async () => {
    updateTaskMock.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useTaskForm(onSuccess, { ...baseTask, id: "t1", project_id: "other" }, "p1"))

    await act(async () => {
      await result.current.onSubmit({ ...baseTask, id: "t1", project_id: "other" })
    })

    expect(updateTaskMock).toHaveBeenCalledWith("t1", expect.objectContaining({ project_id: "p1" }))
  })

  it("leaves project_id as submitted when no lockedProjectId is given (unchanged TaskPage behavior)", async () => {
    createTaskMock.mockResolvedValue(undefined)
    const onSuccess = vi.fn()
    const { result } = renderHook(() => useTaskForm(onSuccess))

    await act(async () => {
      await result.current.onSubmit({ ...baseTask, project_id: "whatever" })
    })

    expect(createTaskMock).toHaveBeenCalledWith(expect.objectContaining({ project_id: "whatever" }))
  })
})
