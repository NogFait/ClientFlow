import { afterEach, describe, expect, it, vi } from "vitest"
import { deleteClient } from "./services"
import { ForeignKeyViolationError } from "../../services/supabaseErrors"

// deleteClient must route Postgres errors through mapSupabaseError so a
// 23503 (foreign_key_violation) — e.g. deleting a cliente that still has
// proyectos referencing it via proyectos_client_id_fkey — surfaces as a
// ForeignKeyViolationError instead of a generic Error. This is what lets
// ClientsPage.handleDelete tell that case apart in its catch block.
const fromMock = vi.fn()

vi.mock("../../services/supabaseClient", () => ({
  supabase: { from: (...args: unknown[]) => fromMock(...args) },
}))

afterEach(() => {
  fromMock.mockReset()
})

function mockDeleteChain(result: { error: { message: string; code?: string; details?: string | null } | null }) {
  const eqMock = vi.fn().mockResolvedValue(result)
  const deleteMock = vi.fn().mockReturnValue({ eq: eqMock })
  fromMock.mockReturnValue({ delete: deleteMock })
  return { deleteMock, eqMock }
}

describe("deleteClient", () => {
  it("throws ForeignKeyViolationError when the client still has proyectos (FK 23503)", async () => {
    const { eqMock } = mockDeleteChain({
      error: {
        code: "23503",
        message:
          'update or delete on table "clientes" violates foreign key constraint "proyectos_client_id_fkey" on table "proyectos"',
        details: null,
      },
    })

    await expect(deleteClient("c1")).rejects.toBeInstanceOf(ForeignKeyViolationError)
    expect(fromMock).toHaveBeenCalledWith("clientes")
    expect(eqMock).toHaveBeenCalledWith("id", "c1")
  })

  it("throws a generic Error carrying the message for unrelated failures (triangulation)", async () => {
    mockDeleteChain({ error: { message: "network error", code: "500" } })

    const error = await deleteClient("c2").catch((e: unknown) => e)

    expect(error).not.toBeInstanceOf(ForeignKeyViolationError)
    expect(error).toBeInstanceOf(Error)
    expect((error as Error).message).toBe("network error")
  })

  it("resolves without throwing when there is no error (triangulation: success path)", async () => {
    mockDeleteChain({ error: null })

    await expect(deleteClient("c3")).resolves.toBeUndefined()
  })
})
