import { describe, expect, it, vi } from "vitest"
import { createSupabaseDigestRepo } from "./digestRepo.js"

describe("createSupabaseDigestRepo", () => {
  it("lists recipients through the DB function (service role only) and maps the rows", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: [{ user_id: "u1", email: "a@b.c" }], error: null })
    const repo = createSupabaseDigestRepo({ rpc, from: vi.fn() } as never)

    await expect(repo.listRecipients()).resolves.toEqual([{ userId: "u1", email: "a@b.c" }])
    expect(rpc).toHaveBeenCalledWith("weekly_digest_recipients")
  })

  it("loads a user's payments (with project+client), tasks (with project), clients and notes, scoped by user_id", async () => {
    const calls: { table: string; select: string; eq: [string, string] }[] = []
    const from = vi.fn().mockImplementation((table: string) => ({
      select: (select: string) => ({
        eq: (col: string, val: string) => {
          calls.push({ table, select, eq: [col, val] })
          return Promise.resolve({ data: [{ table }], error: null })
        },
      }),
    }))
    const repo = createSupabaseDigestRepo({ rpc: vi.fn(), from } as never)

    const data = await repo.loadUserData("u1")

    expect(calls.map((c) => c.table).sort()).toEqual(["clientes", "notas", "pagos", "tareas"])
    expect(calls.every((c) => c.eq[0] === "user_id" && c.eq[1] === "u1")).toBe(true)
    expect(calls.find((c) => c.table === "pagos")?.select).toContain("clientes (name)")
    expect(data.payments).toEqual([{ table: "pagos" }])
    expect(data.notes).toEqual([{ table: "notas" }])
  })

  it("throws the DB error message so the cron reports the failure", async () => {
    const rpc = vi.fn().mockResolvedValue({ data: null, error: { message: "permission denied" } })
    const repo = createSupabaseDigestRepo({ rpc, from: vi.fn() } as never)

    await expect(repo.listRecipients()).rejects.toThrow("permission denied")
  })
})
