import { describe, expect, it, vi } from "vitest"
import { createPortalHandler } from "./portal"
import type { SubscriptionRow } from "../../src/features/billing/domain/subscription"

function fakeRes() {
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

function baseRow(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
  return {
    userId: "user-1",
    planCode: "pro_monthly",
    status: "active",
    provider: "polar",
    providerCustomerId: "cus_1",
    providerSubscriptionId: "sub_1",
    currentPeriodEnd: "2026-10-14T12:00:00.000Z",
    cancelAtPeriodEnd: false,
    graceUntil: null,
    updatedAt: "2026-09-14T11:00:00.000Z",
    ...overrides,
  }
}

function makeDeps(overrides: Partial<Parameters<typeof createPortalHandler>[0]> = {}) {
  return {
    getUser: vi.fn(async () => ({ userId: "user-1", email: "a@b.com" })),
    billingProvider: { createPortalSession: vi.fn(async () => ({ url: "https://polar.sh/portal/xyz" })) },
    repo: { getSubscriptionRow: vi.fn(async () => baseRow()) },
    ...overrides,
  }
}

const REQ_HEADERS = { origin: "https://client-flow-xi.vercel.app" }

describe("createPortalHandler", () => {
  it("returns 401 when there is no valid session", async () => {
    const deps = makeDeps({ getUser: vi.fn(async () => null) })
    const handler = createPortalHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS }, res)

    expect(res.statusCode).toBe(401)
    expect(deps.billingProvider.createPortalSession).not.toHaveBeenCalled()
  })

  it("returns 400 when the user has never checked out (no provider_customer_id)", async () => {
    const deps = makeDeps({ repo: { getSubscriptionRow: vi.fn(async () => baseRow({ providerCustomerId: null })) } })
    const handler = createPortalHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS }, res)

    expect(res.statusCode).toBe(400)
    expect(deps.billingProvider.createPortalSession).not.toHaveBeenCalled()
  })

  it("returns 400 when the user has no subscriptions row at all", async () => {
    const deps = makeDeps({ repo: { getSubscriptionRow: vi.fn(async () => null) } })
    const handler = createPortalHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS }, res)

    expect(res.statusCode).toBe(400)
  })

  it("returns the portal url, using the request origin as the return url", async () => {
    const deps = makeDeps()
    const handler = createPortalHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS }, res)

    expect(deps.billingProvider.createPortalSession).toHaveBeenCalledWith({
      customerId: "cus_1",
      returnUrl: "https://client-flow-xi.vercel.app/settings/billing",
    })
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ url: "https://polar.sh/portal/xyz" })
  })

  it("rejects non-POST methods", async () => {
    const deps = makeDeps()
    const handler = createPortalHandler(deps)
    const res = fakeRes()

    await handler({ method: "GET", headers: REQ_HEADERS }, res)

    expect(res.statusCode).toBe(405)
  })
})
