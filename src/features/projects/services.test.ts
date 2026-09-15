import { afterEach, describe, expect, it, vi } from "vitest"
import { countProjectsByClient, getProjectById, updateProjectStatus, countPaymentsByProject, deleteProject } from "./services"
import { ForeignKeyViolationError } from "../../services/supabaseErrors"

// Mirrors the mocking style of billing/services.test.ts (mock the supabase
// client one level below the service so the service's own query-building
// logic actually runs), adapted for a chained
// .from().select().eq() call instead of a single .rpc() call.
const fromMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

afterEach(() => {
  fromMock.mockReset()
})

function mockCountChain(result: { count: number | null; error: { message: string } | null }) {
  const eqMock = vi.fn().mockResolvedValue(result)
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ select: selectMock })
  return { selectMock, eqMock }
}

function mockMaybeSingleChain(result: { data: unknown; error: { message: string } | null }) {
  const maybeSingleMock = vi.fn().mockResolvedValue(result)
  const eqMock = vi.fn().mockReturnValue({ maybeSingle: maybeSingleMock })
  const selectMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ select: selectMock })
  return { selectMock, eqMock, maybeSingleMock }
}

function mockUpdateEqChain(result: { error: { message: string; code?: string } | null }) {
  const eqMock = vi.fn().mockResolvedValue(result)
  const updateMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ update: updateMock })
  return { updateMock, eqMock }
}

function mockDeleteEqChain(result: { error: { message: string; code?: string } | null }) {
  const eqMock = vi.fn().mockResolvedValue(result)
  const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ delete: deleteMock })
  return { deleteMock, eqMock }
}

describe("countProjectsByClient", () => {
  it("returns the exact count of proyectos linked to the client", async () => {
    const { selectMock, eqMock } = mockCountChain({ count: 2, error: null })

    const result = await countProjectsByClient("c1")

    expect(fromMock).toHaveBeenCalledWith("proyectos")
    expect(selectMock).toHaveBeenCalledWith("id", { count: "exact", head: true })
    expect(eqMock).toHaveBeenCalledWith("client_id", "c1")
    expect(result).toBe(2)
  })

  it("returns 0 when the client has no proyectos (triangulation: different count)", async () => {
    mockCountChain({ count: 0, error: null })

    const result = await countProjectsByClient("c2")

    expect(result).toBe(0)
  })

  it("throws when supabase returns an error (triangulation: error path)", async () => {
    mockCountChain({ count: null, error: { message: "permission denied for table proyectos" } })

    await expect(countProjectsByClient("c3")).rejects.toThrow("permission denied for table proyectos")
  })
})

describe("getProjectById", () => {
  it("returns the project joined with its client's name", async () => {
    const row = { id: "p1", name: "Sitio Web", status: "activo", clientes: { name: "Acme" } }
    const { selectMock, eqMock } = mockMaybeSingleChain({ data: row, error: null })

    const result = await getProjectById("p1")

    expect(fromMock).toHaveBeenCalledWith("proyectos")
    expect(selectMock).toHaveBeenCalledWith(`*, clientes (name)`)
    expect(eqMock).toHaveBeenCalledWith("id", "p1")
    expect(result).toEqual(row)
  })

  it("returns null when the project doesn't exist or is hidden by RLS (triangulation)", async () => {
    mockMaybeSingleChain({ data: null, error: null })

    const result = await getProjectById("missing")

    expect(result).toBeNull()
  })

  it("throws when supabase returns an error", async () => {
    mockMaybeSingleChain({ data: null, error: { message: "permission denied for table proyectos" } })

    await expect(getProjectById("p1")).rejects.toThrow("permission denied for table proyectos")
  })
})

describe("updateProjectStatus", () => {
  it("updates only the status field for the given project id", async () => {
    const { updateMock, eqMock } = mockUpdateEqChain({ error: null })

    await updateProjectStatus("p1", "completo")

    expect(fromMock).toHaveBeenCalledWith("proyectos")
    expect(updateMock).toHaveBeenCalledWith({ status: "completo" })
    expect(eqMock).toHaveBeenCalledWith("id", "p1")
  })

  it("throws when supabase returns an error (triangulation)", async () => {
    mockUpdateEqChain({ error: { message: "permission denied for table proyectos" } })

    await expect(updateProjectStatus("p1", "pausado")).rejects.toThrow("permission denied for table proyectos")
  })
})

describe("countPaymentsByProject", () => {
  it("returns the exact count of pagos linked to the project", async () => {
    const { selectMock, eqMock } = mockCountChain({ count: 3, error: null })

    const result = await countPaymentsByProject("p1")

    expect(fromMock).toHaveBeenCalledWith("pagos")
    expect(selectMock).toHaveBeenCalledWith("id", { count: "exact", head: true })
    expect(eqMock).toHaveBeenCalledWith("project_id", "p1")
    expect(result).toBe(3)
  })

  it("returns 0 when the project has no pagos (triangulation)", async () => {
    mockCountChain({ count: 0, error: null })

    const result = await countPaymentsByProject("p2")

    expect(result).toBe(0)
  })

  it("throws when supabase returns an error", async () => {
    mockCountChain({ count: null, error: { message: "permission denied for table pagos" } })

    await expect(countPaymentsByProject("p3")).rejects.toThrow("permission denied for table pagos")
  })
})

describe("deleteProject — error mapping", () => {
  it("maps a 23503 foreign-key violation to ForeignKeyViolationError (pagos still reference the project)", async () => {
    mockDeleteEqChain({ error: { message: 'violates foreign key constraint "pagos_project_id_fkey"', code: "23503" } })

    await expect(deleteProject("p1")).rejects.toBeInstanceOf(ForeignKeyViolationError)
  })

  it("resolves without throwing when supabase reports no error (triangulation)", async () => {
    mockDeleteEqChain({ error: null })

    await expect(deleteProject("p1")).resolves.toBeUndefined()
  })
})
