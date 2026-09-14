import { describe, expect, it, vi } from "vitest"
import { createCheckoutHandler } from "./checkout"
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
    planCode: "free",
    status: "free",
    provider: null,
    providerCustomerId: null,
    providerSubscriptionId: null,
    currentPeriodEnd: null,
    cancelAtPeriodEnd: false,
    graceUntil: null,
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function makeDeps(overrides: Partial<Parameters<typeof createCheckoutHandler>[0]> = {}) {
  return {
    getUser: vi.fn(async () => ({ userId: "user-1", email: "a@b.com" })),
    billingProvider: {
      ensureCustomer: vi.fn(async () => ({ customerId: "cus_new" })),
      createCheckout: vi.fn(async () => ({ url: "https://polar.sh/checkout/abc" })),
    },
    repo: {
      getSubscriptionRow: vi.fn(async () => baseRow()),
      setProviderCustomerId: vi.fn(async () => {}),
    },
    isBillingEnabled: vi.fn(() => true),
    ...overrides,
  }
}

const REQ_HEADERS = { origin: "https://client-flow-xi.vercel.app" }

describe("createCheckoutHandler", () => {
  it("refuses when billing is disabled server-side, before touching auth or Polar", async () => {
    const deps = makeDeps({ isBillingEnabled: vi.fn(() => false) })
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "pro_monthly" } }, res)

    expect(res.statusCode).toBe(403)
    expect(deps.getUser).not.toHaveBeenCalled()
    expect(deps.billingProvider.createCheckout).not.toHaveBeenCalled()
  })

  it("returns 401 when there is no valid session", async () => {
    const deps = makeDeps({ getUser: vi.fn(async () => null) })
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "pro_monthly" } }, res)

    expect(res.statusCode).toBe(401)
    expect(deps.billingProvider.createCheckout).not.toHaveBeenCalled()
  })

  it("returns 400 for an invalid plan", async () => {
    const deps = makeDeps()
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "gold" } }, res)

    expect(res.statusCode).toBe(400)
  })

  it("returns 409 when the user is already an active Pro subscriber", async () => {
    const deps = makeDeps({
      repo: {
        getSubscriptionRow: vi.fn(async () => baseRow({ status: "active", planCode: "pro_monthly" })),
        setProviderCustomerId: vi.fn(async () => {}),
      },
    })
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "pro_yearly" } }, res)

    expect(res.statusCode).toBe(409)
    expect(deps.billingProvider.createCheckout).not.toHaveBeenCalled()
  })

  it("creates a Polar customer and persists it on first checkout", async () => {
    const deps = makeDeps()
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "pro_monthly" } }, res)

    expect(deps.billingProvider.ensureCustomer).toHaveBeenCalledWith({ userId: "user-1", email: "a@b.com" })
    expect(deps.repo.setProviderCustomerId).toHaveBeenCalledWith("user-1", "polar", "cus_new")
    expect(deps.billingProvider.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cus_new", userId: "user-1", plan: "pro_monthly" })
    )
    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ url: "https://polar.sh/checkout/abc" })
  })

  it("reuses the existing provider_customer_id instead of creating a duplicate customer", async () => {
    const deps = makeDeps({
      repo: {
        getSubscriptionRow: vi.fn(async () => baseRow({ providerCustomerId: "cus_existing", provider: "polar" })),
        setProviderCustomerId: vi.fn(async () => {}),
      },
    })
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "pro_yearly" } }, res)

    expect(deps.billingProvider.ensureCustomer).not.toHaveBeenCalled()
    expect(deps.repo.setProviderCustomerId).not.toHaveBeenCalled()
    expect(deps.billingProvider.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cus_existing" })
    )
  })

  it("builds the success url from the request origin, per design §3", async () => {
    const deps = makeDeps()
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "POST", headers: REQ_HEADERS, body: { plan: "pro_monthly" } }, res)

    expect(deps.billingProvider.createCheckout).toHaveBeenCalledWith(
      expect.objectContaining({ successUrl: "https://client-flow-xi.vercel.app/settings/billing?checkout=success" })
    )
  })

  it("rejects non-POST methods", async () => {
    const deps = makeDeps()
    const handler = createCheckoutHandler(deps)
    const res = fakeRes()

    await handler({ method: "GET", headers: REQ_HEADERS }, res)

    expect(res.statusCode).toBe(405)
  })
})
