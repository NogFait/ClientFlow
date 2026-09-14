import { describe, expect, it, vi } from "vitest"
import { processWebhookRequest, createWebhookHandler } from "./webhook"
import { InvalidSignatureError } from "../../src/features/billing/ports/BillingProvider"
import type { NormalizedSubscription } from "../../src/features/billing/ports/BillingProvider"
import type { SubscriptionRow } from "../../src/features/billing/domain/subscription"

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
    updatedAt: "2020-01-01T00:00:00.000Z",
    ...overrides,
  }
}

function baseSub(overrides: Partial<NormalizedSubscription> = {}): NormalizedSubscription {
  return {
    providerSubscriptionId: "sub_1",
    providerCustomerId: "cus_1",
    userId: "user-1",
    plan: "pro_monthly",
    status: "active",
    currentPeriodEnd: "2026-10-14T12:00:00.000Z",
    cancelAtPeriodEnd: false,
    occurredAt: "2026-09-14T12:00:00.000Z",
    ...overrides,
  }
}

function makeDeps(overrides: Partial<Parameters<typeof processWebhookRequest>[2]> = {}) {
  return {
    billingProvider: {
      parseWebhook: vi.fn(() => ({
        kind: "subscription" as const,
        eventId: "evt_1",
        type: "subscription.active",
        subscription: baseSub(),
      })),
      fetchSubscription: vi.fn(async () => baseSub()),
    },
    repo: {
      recordBillingEvent: vi.fn(async () => ({ id: 1, alreadyProcessed: false })),
      markEventProcessed: vi.fn(async () => {}),
      getSubscriptionRow: vi.fn(async () => baseRow()),
      applySubscriptionChange: vi.fn(async () => {}),
      findUserIdByProviderCustomerId: vi.fn(async () => null),
    },
    now: () => new Date("2026-09-14T12:30:00.000Z"),
    ...overrides,
  }
}

const HEADERS = { "webhook-id": "evt_1", "webhook-signature": "sig", "webhook-timestamp": "123" }

describe("processWebhookRequest", () => {
  it("returns 401 and records nothing when the signature is invalid", async () => {
    const deps = makeDeps({
      billingProvider: {
        parseWebhook: vi.fn(() => {
          throw new InvalidSignatureError("bad signature")
        }),
        fetchSubscription: vi.fn(async () => baseSub()),
      },
    })

    const result = await processWebhookRequest("{}", HEADERS, deps)

    expect(result.status).toBe(401)
    expect(deps.repo.recordBillingEvent).not.toHaveBeenCalled()
    expect(deps.repo.applySubscriptionChange).not.toHaveBeenCalled()
  })

  it("returns 200 duplicate=true and applies nothing when the event was already processed", async () => {
    const deps = makeDeps({
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 1, alreadyProcessed: true })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow()),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    const result = await processWebhookRequest("{}", HEADERS, deps)

    expect(result).toEqual({ status: 200, body: { duplicate: true } })
    expect(deps.billingProvider.fetchSubscription).not.toHaveBeenCalled()
    expect(deps.repo.applySubscriptionChange).not.toHaveBeenCalled()
  })

  it("marks a non-subscription (ignored) event processed and returns 200 without touching subscriptions", async () => {
    const deps = makeDeps({
      billingProvider: {
        parseWebhook: vi.fn(() => ({ kind: "ignored" as const, eventId: "evt_2", type: "checkout.updated" })),
        fetchSubscription: vi.fn(async () => baseSub()),
      },
    })

    const result = await processWebhookRequest("{}", HEADERS, deps)

    expect(result).toEqual({ status: 200, body: { ignored: true } })
    expect(deps.repo.markEventProcessed).toHaveBeenCalledWith(1)
    expect(deps.billingProvider.fetchSubscription).not.toHaveBeenCalled()
    expect(deps.repo.applySubscriptionChange).not.toHaveBeenCalled()
  })

  it("applies a fresh subscription event: fetch-then-apply feeds the reducer and persists via the RPC", async () => {
    const deps = makeDeps({
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 5, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow()),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    const result = await processWebhookRequest("{}", HEADERS, deps)

    expect(deps.billingProvider.fetchSubscription).toHaveBeenCalledWith("sub_1")
    expect(deps.repo.applySubscriptionChange).toHaveBeenCalledWith(
      expect.objectContaining({
        billingEventId: 5,
        row: expect.objectContaining({ planCode: "pro_monthly", status: "active" }),
      })
    )
    expect(result).toEqual({ status: 200, body: { applied: true } })
  })

  it("uses the CURRENT fetched state, not the webhook body's own snapshot (fetch-then-apply)", async () => {
    const deps = makeDeps({
      billingProvider: {
        parseWebhook: vi.fn(() => ({
          kind: "subscription" as const,
          eventId: "evt_1",
          type: "subscription.active",
          subscription: baseSub({ plan: "pro_monthly" }),
        })),
        fetchSubscription: vi.fn(async () => baseSub({ plan: "pro_yearly", occurredAt: "2026-09-14T13:00:00.000Z" })),
      },
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 5, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow()),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    await processWebhookRequest("{}", HEADERS, deps)

    expect(deps.repo.applySubscriptionChange).toHaveBeenCalledWith(
      expect.objectContaining({ row: expect.objectContaining({ planCode: "pro_yearly" }) })
    )
  })

  it("out-of-order: a stale fetched state (older than the current row) is recorded but not applied", async () => {
    const currentRow = baseRow({
      planCode: "pro_yearly",
      status: "active",
      currentPeriodEnd: "2027-09-14T12:00:00.000Z",
      updatedAt: "2026-09-14T15:00:00.000Z",
    })
    const deps = makeDeps({
      billingProvider: {
        parseWebhook: vi.fn(() => ({
          kind: "subscription" as const,
          eventId: "evt_stale",
          type: "subscription.active",
          subscription: baseSub(),
        })),
        fetchSubscription: vi.fn(async () => baseSub({ occurredAt: "2026-09-14T10:00:00.000Z" })),
      },
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 9, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => currentRow),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    const result = await processWebhookRequest("{}", HEADERS, deps)

    expect(deps.repo.applySubscriptionChange).not.toHaveBeenCalled()
    expect(deps.repo.markEventProcessed).toHaveBeenCalledWith(9)
    expect(result).toEqual({ status: 200, body: { applied: false } })
  })

  it("resolves the user via provider_customer_id when the fetched customer has no external id or metadata", async () => {
    const deps = makeDeps({
      billingProvider: {
        parseWebhook: vi.fn(() => ({
          kind: "subscription" as const,
          eventId: "evt_1",
          type: "subscription.active",
          subscription: baseSub({ userId: null }),
        })),
        fetchSubscription: vi.fn(async () => baseSub({ userId: null })),
      },
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 5, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow({ userId: "resolved-user" })),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => "resolved-user"),
      },
    })

    await processWebhookRequest("{}", HEADERS, deps)

    expect(deps.repo.findUserIdByProviderCustomerId).toHaveBeenCalledWith("cus_1")
    expect(deps.repo.getSubscriptionRow).toHaveBeenCalledWith("resolved-user")
  })

  it("throws (surfacing as 500 upstream) when the user cannot be resolved at all", async () => {
    const deps = makeDeps({
      billingProvider: {
        parseWebhook: vi.fn(() => ({
          kind: "subscription" as const,
          eventId: "evt_1",
          type: "subscription.active",
          subscription: baseSub({ userId: null }),
        })),
        fetchSubscription: vi.fn(async () => baseSub({ userId: null })),
      },
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 5, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow()),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    await expect(processWebhookRequest("{}", HEADERS, deps)).rejects.toThrow(/resolve/i)
    expect(deps.repo.applySubscriptionChange).not.toHaveBeenCalled()
  })

  it("propagates a persistence failure so the caller can 500 and let Polar retry", async () => {
    const deps = makeDeps({
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 5, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow()),
        applySubscriptionChange: vi.fn(async () => {
          throw new Error("db unavailable")
        }),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    await expect(processWebhookRequest("{}", HEADERS, deps)).rejects.toThrow("db unavailable")
  })

  it("defaults to a free row when the user genuinely has no subscriptions row yet (defense in depth)", async () => {
    const deps = makeDeps({
      repo: {
        recordBillingEvent: vi.fn(async () => ({ id: 5, alreadyProcessed: false })),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => null),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })

    await processWebhookRequest("{}", HEADERS, deps)

    expect(deps.repo.applySubscriptionChange).toHaveBeenCalledWith(
      expect.objectContaining({ row: expect.objectContaining({ status: "active", planCode: "pro_monthly" }) })
    )
  })
})

describe("createWebhookHandler", () => {
  it("reads the raw request stream, dispatches to processWebhookRequest, and writes the response", async () => {
    const deps = makeDeps()
    const handler = createWebhookHandler(deps)
    const body = JSON.stringify({ type: "subscription.active" })
    const req = {
      headers: HEADERS,
      async *[Symbol.asyncIterator]() {
        yield Buffer.from(body)
      },
    }
    const res = {
      statusCode: 0,
      body: undefined as unknown,
      status(code: number) {
        res.statusCode = code
        return { json: (b: unknown) => { res.body = b } }
      },
    }

    await handler(req, res)

    expect(res.statusCode).toBe(200)
    expect(res.body).toEqual({ applied: true })
  })

  it("responds 500 without leaking internal error details when processing throws", async () => {
    const deps = makeDeps({
      repo: {
        recordBillingEvent: vi.fn(async () => {
          throw new Error("db unavailable")
        }),
        markEventProcessed: vi.fn(async () => {}),
        getSubscriptionRow: vi.fn(async () => baseRow()),
        applySubscriptionChange: vi.fn(async () => {}),
        findUserIdByProviderCustomerId: vi.fn(async () => null),
      },
    })
    const handler = createWebhookHandler(deps)
    const req = {
      headers: HEADERS,
      async *[Symbol.asyncIterator]() {
        yield Buffer.from("{}")
      },
    }
    const res = {
      statusCode: 0,
      body: undefined as unknown,
      status(code: number) {
        res.statusCode = code
        return { json: (b: unknown) => { res.body = b } }
      },
    }

    await handler(req, res)

    expect(res.statusCode).toBe(500)
    expect(res.body).toEqual({ error: "internal_error" })
  })
})
