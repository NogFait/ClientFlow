import { afterEach, describe, expect, it, vi } from "vitest"

const fromMock = vi.fn()
const getUserMock = vi.fn()

vi.mock("../../../services/supabaseClient", () => ({
  supabase: {
    from: (...args: unknown[]) => fromMock(...args),
    auth: { getUser: () => getUserMock() },
  },
}))

afterEach(() => {
  fromMock.mockReset()
  getUserMock.mockReset()
})

describe("getClientNotes", () => {
  it("lists the client's notes newest first (by note date, then by creation)", async () => {
    const rows = [{ id: "n2", client_id: "c1", note_date: "2026-09-15", content: "Quedé en escribirle" }]
    const order2 = vi.fn().mockResolvedValue({ data: rows, error: null })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    const eq = vi.fn().mockReturnValue({ order: order1 })
    const select = vi.fn().mockReturnValue({ eq })
    fromMock.mockReturnValue({ select })
    const { getClientNotes } = await import("./services")

    const notes = await getClientNotes("c1")

    expect(notes).toEqual(rows)
    expect(fromMock).toHaveBeenCalledWith("notas")
    expect(eq).toHaveBeenCalledWith("client_id", "c1")
    expect(order1).toHaveBeenCalledWith("note_date", { ascending: false })
    expect(order2).toHaveBeenCalledWith("created_at", { ascending: false })
  })

  it("throws the Supabase message on failure", async () => {
    const order2 = vi.fn().mockResolvedValue({ data: null, error: { message: "permission denied" } })
    const order1 = vi.fn().mockReturnValue({ order: order2 })
    fromMock.mockReturnValue({ select: () => ({ eq: () => ({ order: order1 }) }) })
    const { getClientNotes } = await import("./services")

    await expect(getClientNotes("c1")).rejects.toThrow("permission denied")
  })
})

describe("createClientNote", () => {
  it("inserts the note for the signed-in user and returns the stored row", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } })
    const stored = { id: "n1", client_id: "c1", user_id: "u1", note_date: "2026-09-03", content: "Pasé presupuesto" }
    const single = vi.fn().mockResolvedValue({ data: stored, error: null })
    const select = vi.fn().mockReturnValue({ single })
    const insert = vi.fn().mockReturnValue({ select })
    fromMock.mockReturnValue({ insert })
    const { createClientNote } = await import("./services")

    const note = await createClientNote({ client_id: "c1", note_date: "2026-09-03", content: "Pasé presupuesto" })

    expect(note).toEqual(stored)
    expect(insert).toHaveBeenCalledWith({ client_id: "c1", note_date: "2026-09-03", content: "Pasé presupuesto", user_id: "u1" })
  })

  it("throws the Supabase message on failure (e.g. the not-blank check)", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } })
    const single = vi.fn().mockResolvedValue({ data: null, error: { message: "violates check constraint" } })
    fromMock.mockReturnValue({ insert: () => ({ select: () => ({ single }) }) })
    const { createClientNote } = await import("./services")

    await expect(createClientNote({ client_id: "c1", note_date: "2026-09-03", content: " " })).rejects.toThrow(
      "violates check constraint",
    )
  })
})

describe("deleteClientNote", () => {
  it("deletes by id", async () => {
    const eq = vi.fn().mockResolvedValue({ error: null })
    fromMock.mockReturnValue({ delete: () => ({ eq }) })
    const { deleteClientNote } = await import("./services")

    await expect(deleteClientNote("n1")).resolves.toBeUndefined()
    expect(fromMock).toHaveBeenCalledWith("notas")
    expect(eq).toHaveBeenCalledWith("id", "n1")
  })

  it("throws the Supabase message on failure", async () => {
    fromMock.mockReturnValue({ delete: () => ({ eq: vi.fn().mockResolvedValue({ error: { message: "network down" } }) }) })
    const { deleteClientNote } = await import("./services")

    await expect(deleteClientNote("n1")).rejects.toThrow("network down")
  })
})
