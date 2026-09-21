import { describe, expect, it, vi } from "vitest"
import { createWeeklyDigestHandler, todayInArgentina, type DigestRepo } from "./weekly-digest.js"

vi.mock("../_lib/supabaseAdmin.js", () => ({ getSupabaseAdmin: vi.fn() }))
vi.mock("../_lib/digest/digestRepo.js", () => ({ createSupabaseDigestRepo: vi.fn() }))

function mockRes() {
  const res = {
    statusCode: 0,
    body: undefined as unknown,
    status(code: number) {
      res.statusCode = code
      return { json: (b: unknown) => { res.body = b } }
    },
  }
  return res
}

const tita = { userId: "u1", email: "tita@estudio.com" }
const pepe = { userId: "u2", email: "pepe@fotos.com" }

function makeRepo(overrides: Partial<DigestRepo> = {}): DigestRepo {
  return {
    listRecipients: vi.fn().mockResolvedValue([tita, pepe]),
    loadUserData: vi.fn().mockImplementation(async (userId: string) =>
      userId === "u1"
        ? {
            payments: [{ amount: 1000, status: "pendiente", payment_date: "2026-09-23", proyectos: { name: "Web", clientes: { name: "Acme" } } }],
            tasks: [],
            clients: [],
            notes: [],
          }
        : { payments: [], tasks: [], clients: [], notes: [] },
    ),
    ...overrides,
  }
}

const base = { cronSecret: "s3cret", today: () => "2026-09-21", appUrl: "https://clientflow.lat" }

describe("weekly digest cron handler", () => {
  it("rejects requests without the cron secret", async () => {
    const send = vi.fn()
    const handler = createWeeklyDigestHandler({ ...base, repo: makeRepo(), send })
    const res = mockRes()

    await handler({ method: "GET", headers: { authorization: "Bearer nope" } }, res)

    expect(res.statusCode).toBe(401)
    expect(send).not.toHaveBeenCalled()
  })

  it("emails each Pro recipient who has something to report, and skips the ones with an empty week", async () => {
    const send = vi.fn().mockResolvedValue({ id: "em_1" })
    const handler = createWeeklyDigestHandler({ ...base, repo: makeRepo(), send })
    const res = mockRes()

    await handler({ method: "GET", headers: { authorization: "Bearer s3cret" } }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ recipients: 2, sent: 1, skipped: 1, failed: 0 })
    expect(send).toHaveBeenCalledTimes(1)
    const email = send.mock.calls[0][0]
    expect(email.to).toBe("tita@estudio.com")
    expect(email.subject).toContain("$ 1.000 por cobrar")
    expect(email.html).toContain("Acme")
  })

  it("keeps going when one send fails and reports it, without failing the run", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {})
    const send = vi.fn().mockRejectedValueOnce(new Error("Resend 500: boom")).mockResolvedValue({ id: "em_2" })
    const repo = makeRepo({
      loadUserData: vi.fn().mockResolvedValue({
        payments: [{ amount: 5, status: "pendiente", payment_date: "2026-09-22", proyectos: null }],
        tasks: [], clients: [], notes: [],
      }),
    })
    const handler = createWeeklyDigestHandler({ ...base, repo, send })
    const res = mockRes()

    await handler({ method: "GET", headers: { authorization: "Bearer s3cret" } }, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ recipients: 2, sent: 1, skipped: 0, failed: 1 })
  })

  it("accepts a dry run that renders but does not send (for manual checks)", async () => {
    const send = vi.fn()
    const handler = createWeeklyDigestHandler({ ...base, repo: makeRepo(), send })
    const res = mockRes()

    await handler({ method: "GET", headers: { authorization: "Bearer s3cret" }, query: { dry: "1" } }, res)

    expect(send).not.toHaveBeenCalled()
    expect(res.body).toMatchObject({ recipients: 2, sent: 0, skipped: 1, dryRun: true })
    expect((res.body as { previews: { to: string; subject: string }[] }).previews[0].to).toBe("tita@estudio.com")
  })
})

describe("todayInArgentina", () => {
  it("is the Argentine calendar day even when UTC has already rolled over", () => {
    // 2026-09-22T01:30Z is still 21 Sep 22:30 in Buenos Aires (UTC-3)
    expect(todayInArgentina(new Date("2026-09-22T01:30:00Z"))).toBe("2026-09-21")
    expect(todayInArgentina(new Date("2026-09-22T11:00:00Z"))).toBe("2026-09-22")
  })
})
