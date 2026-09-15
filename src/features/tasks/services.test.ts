import { afterEach, describe, expect, it, vi } from "vitest"
import { getTasksByProject, updateTaskStatus } from "./services"

// Mirrors the mocking style of projects/services.test.ts and
// payments/services.test.ts (mock the supabase client one level below the
// service so the service's own query-building logic actually runs).
const fromMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

afterEach(() => {
  fromMock.mockReset()
})

function mockOrderOrderChain(result: { data: unknown[] | null; error: { message: string } | null }) {
  const order2Mock = vi.fn().mockResolvedValue(result)
  const order1Mock = vi.fn().mockReturnValue({ order: order2Mock })
  const eqMock = vi.fn().mockReturnValue({ order: order1Mock })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ select: selectMock })
  return { selectMock, eqMock, order1Mock, order2Mock }
}

function mockUpdateEqChain(result: { error: { message: string } | null }) {
  const eqMock = vi.fn().mockResolvedValue(result)
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ update: updateMock })
  return { updateMock, eqMock }
}

describe("getTasksByProject", () => {
  it("queries tareas for the project ordered by due_date (nulls last) then created_at", async () => {
    const rows = [{ id: "t1", title: "Diseño", status: "pendiente", priority: "medium", project_id: "p1" }]
    const { selectMock, eqMock, order1Mock, order2Mock } = mockOrderOrderChain({ data: rows, error: null })

    const result = await getTasksByProject("p1")

    expect(fromMock).toHaveBeenCalledWith("tareas")
    expect(selectMock).toHaveBeenCalledWith("*")
    expect(eqMock).toHaveBeenCalledWith("project_id", "p1")
    expect(order1Mock).toHaveBeenCalledWith("due_date", { ascending: true, nullsFirst: false })
    expect(order2Mock).toHaveBeenCalledWith("created_at", { ascending: true })
    expect(result).toEqual(rows)
  })

  it("returns an empty array when the project has no tasks (triangulation)", async () => {
    mockOrderOrderChain({ data: [], error: null })

    const result = await getTasksByProject("p2")

    expect(result).toEqual([])
  })

  it("throws when supabase returns an error", async () => {
    mockOrderOrderChain({ data: null, error: { message: "permission denied for table tareas" } })

    await expect(getTasksByProject("p3")).rejects.toThrow("permission denied for table tareas")
  })
})

describe("updateTaskStatus", () => {
  it("updates only the status field for the given task id", async () => {
    const { updateMock, eqMock } = mockUpdateEqChain({ error: null })

    await updateTaskStatus("t1", "hechas")

    expect(fromMock).toHaveBeenCalledWith("tareas")
    expect(updateMock).toHaveBeenCalledWith({ status: "hechas" })
    expect(eqMock).toHaveBeenCalledWith("id", "t1")
  })

  it("throws when supabase returns an error (triangulation)", async () => {
    mockUpdateEqChain({ error: { message: "permission denied for table tareas" } })

    await expect(updateTaskStatus("t1", "pendiente")).rejects.toThrow("permission denied for table tareas")
  })
})
