import { afterEach, describe, expect, it, vi } from "vitest"
import { countProjectsByClient } from "./services"

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
