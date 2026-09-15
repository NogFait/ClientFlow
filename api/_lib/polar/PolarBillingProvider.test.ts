import { randomBytes } from "node:crypto"
import { describe, expect, it, vi } from "vitest"
import type { Polar } from "@polar-sh/sdk"
import { Webhook } from "standardwebhooks"
import { InvalidSignatureError } from "../../../src/features/billing/ports/BillingProvider.js"
import { PolarBillingProvider } from "./PolarBillingProvider.js"

// A real Standard Webhooks secret in the format Polar's dashboard now issues
// (`whsec_<base64>`) — the whole point of this bugfix is that a prefixed
// secret must verify correctly, unlike the old @polar-sh/sdk validateEvent
// path which double-base64-encoded it and always failed.
const WEBHOOK_SECRET = `whsec_${randomBytes(32).toString("base64")}`

function signHeaders(body: string, opts: { id?: string; secret?: string; timestamp?: Date } = {}) {
  const id = opts.id ?? "evt_1"
  const secret = opts.secret ?? WEBHOOK_SECRET
  const timestamp = opts.timestamp ?? new Date()
  const signature = new Webhook(secret).sign(id, timestamp, body)
  return {
    "webhook-id": id,
    "webhook-timestamp": String(Math.floor(timestamp.getTime() / 1000)),
    "webhook-signature": signature,
  }
}

const ENV = {
  accessToken: "token",
  server: "sandbox" as const,
  productProMonthly: "prod_monthly_id",
  productProYearly: "prod_yearly_id",
}

function fakeClient(overrides: Record<string, unknown> = {}) {
  return {
    customers: { getExternal: vi.fn(), create: vi.fn() },
    checkouts: { create: vi.fn() },
    customerSessions: { create: vi.fn() },
    subscriptions: { get: vi.fn() },
    ...overrides,
  } as unknown as Polar
}

function baseSubscription(overrides: Record<string, unknown> = {}) {
  return {
    id: "sub_123",
    customerId: "cus_123",
    productId: "prod_monthly_id",
    product: { metadata: {} },
    metadata: {},
    customer: { id: "cus_123", externalId: "user-1", metadata: {} },
    status: "active",
    currentPeriodEnd: new Date("2026-10-14T12:00:00.000Z"),
    cancelAtPeriodEnd: false,
    ...overrides,
  }
}

describe("PolarBillingProvider.ensureCustomer", () => {
  it("reuses an existing customer found by external id", async () => {
    const client = fakeClient()
    ;(client.customers.getExternal as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "cus_existing" })
    const provider = new PolarBillingProvider(client, ENV, () => "secret")

    const result = await provider.ensureCustomer({ userId: "user-1", email: "a@b.com" })

    expect(result).toEqual({ customerId: "cus_existing" })
    expect(client.customers.create).not.toHaveBeenCalled()
  })

  it("creates a new customer when none exists for that external id", async () => {
    const client = fakeClient()
    ;(client.customers.getExternal as ReturnType<typeof vi.fn>).mockRejectedValue(
      Object.assign(new Error("not found"), { error: "ResourceNotFound" })
    )
    ;(client.customers.create as ReturnType<typeof vi.fn>).mockResolvedValue({ id: "cus_new" })
    const provider = new PolarBillingProvider(client, ENV, () => "secret")

    const result = await provider.ensureCustomer({ userId: "user-1", email: "a@b.com" })

    expect(result).toEqual({ customerId: "cus_new" })
    expect(client.customers.create).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: "user-1", email: "a@b.com" })
    )
  })

  it("propagates unexpected errors instead of masking them as not-found", async () => {
    const client = fakeClient()
    ;(client.customers.getExternal as ReturnType<typeof vi.fn>).mockRejectedValue(new Error("network down"))
    const provider = new PolarBillingProvider(client, ENV, () => "secret")

    await expect(provider.ensureCustomer({ userId: "user-1", email: "a@b.com" })).rejects.toThrow("network down")
    expect(client.customers.create).not.toHaveBeenCalled()
  })
})

describe("PolarBillingProvider.createCheckout", () => {
  it("maps pro_monthly to the configured product id and returns the checkout url", async () => {
    const client = fakeClient()
    ;(client.checkouts.create as ReturnType<typeof vi.fn>).mockResolvedValue({ url: "https://polar.sh/checkout/abc" })
    const provider = new PolarBillingProvider(client, ENV, () => "secret")

    const result = await provider.createCheckout({
      customerId: "cus_1",
      userId: "user-1",
      plan: "pro_monthly",
      successUrl: "https://app/success",
    })

    expect(result).toEqual({ url: "https://polar.sh/checkout/abc" })
    expect(client.checkouts.create).toHaveBeenCalledWith(
      expect.objectContaining({ products: ["prod_monthly_id"], customerId: "cus_1", successUrl: "https://app/success" })
    )
  })

  it("maps pro_yearly to the yearly product id", async () => {
    const client = fakeClient()
    ;(client.checkouts.create as ReturnType<typeof vi.fn>).mockResolvedValue({ url: "https://polar.sh/checkout/xyz" })
    const provider = new PolarBillingProvider(client, ENV, () => "secret")

    await provider.createCheckout({ customerId: "cus_1", userId: "user-1", plan: "pro_yearly", successUrl: "https://app/success" })

    expect(client.checkouts.create).toHaveBeenCalledWith(expect.objectContaining({ products: ["prod_yearly_id"] }))
  })
})

describe("PolarBillingProvider.createPortalSession", () => {
  it("returns the customer portal url", async () => {
    const client = fakeClient()
    ;(client.customerSessions.create as ReturnType<typeof vi.fn>).mockResolvedValue({
      customerPortalUrl: "https://polar.sh/portal/xyz",
    })
    const provider = new PolarBillingProvider(client, ENV, () => "secret")

    const result = await provider.createPortalSession({ customerId: "cus_1", returnUrl: "https://app/settings" })

    expect(result).toEqual({ url: "https://polar.sh/portal/xyz" })
    expect(client.customerSessions.create).toHaveBeenCalledWith(
      expect.objectContaining({ customerId: "cus_1", returnUrl: "https://app/settings" })
    )
  })
})

describe("PolarBillingProvider.parseWebhook", () => {
  it("throws InvalidSignatureError when headers are missing entirely", () => {
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    expect(() => provider.parseWebhook("{}", { "webhook-signature": "bad" })).toThrow(InvalidSignatureError)
  })

  it("throws InvalidSignatureError when the body was tampered with after signing", () => {
    const signedBody = JSON.stringify({ type: "subscription.active", timestamp: new Date().toISOString(), data: baseSubscription() })
    const headers = signHeaders(signedBody)
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const tamperedBody = JSON.stringify({ type: "subscription.canceled", timestamp: new Date().toISOString(), data: baseSubscription() })
    expect(() => provider.parseWebhook(tamperedBody, headers)).toThrow(InvalidSignatureError)
  })

  it("throws InvalidSignatureError when signed with the wrong secret", () => {
    const body = JSON.stringify({ type: "subscription.active", timestamp: new Date().toISOString(), data: baseSubscription() })
    const headers = signHeaders(body, { secret: `whsec_${randomBytes(32).toString("base64")}` })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    expect(() => provider.parseWebhook(body, headers)).toThrow(InvalidSignatureError)
  })

  it("verifies correctly with a legacy plain (non-prefixed) base64 secret", () => {
    const plainSecret = randomBytes(32).toString("base64")
    const body = JSON.stringify({ type: "checkout.updated", timestamp: new Date().toISOString(), data: {} })
    const headers = signHeaders(body, { secret: plainSecret, id: "evt_plain" })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => plainSecret)

    const result = provider.parseWebhook(body, headers)

    expect(result).toEqual({ kind: "ignored", eventId: "evt_plain", type: "checkout.updated" })
  })

  it("verifies correctly regardless of header key casing", () => {
    const body = JSON.stringify({ type: "checkout.updated", timestamp: new Date().toISOString(), data: {} })
    const lowercase = signHeaders(body, { id: "evt_case" })
    const mixedCase: Record<string, string> = {
      "Webhook-Id": lowercase["webhook-id"],
      "Webhook-Timestamp": lowercase["webhook-timestamp"],
      "Webhook-Signature": lowercase["webhook-signature"],
    }
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, mixedCase)

    expect(result).toEqual({ kind: "ignored", eventId: "evt_case", type: "checkout.updated" })
  })

  it("returns an ignored event for a non-subscription event type", () => {
    const body = JSON.stringify({ type: "checkout.updated", timestamp: new Date().toISOString(), data: {} })
    const headers = signHeaders(body, { id: "evt_1" })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toEqual({ kind: "ignored", eventId: "evt_1", type: "checkout.updated" })
  })

  it("returns an ignored 'unknown' event when the payload has no recognizable type field", () => {
    const body = JSON.stringify({ foo: "bar" })
    const headers = signHeaders(body, { id: "evt_2" })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toEqual({ kind: "ignored", eventId: "evt_2", type: "unknown" })
  })

  it("normalizes a subscription.active event into a subscription BillingEvent", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    const body = JSON.stringify({ type: "subscription.active", timestamp: timestamp.toISOString(), data: baseSubscription() })
    const headers = signHeaders(body, { id: "evt_3" }) // sign with "now"; occurredAt comes from the body's own timestamp field
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toEqual({
      kind: "subscription",
      eventId: "evt_3",
      type: "subscription.active",
      subscription: {
        providerSubscriptionId: "sub_123",
        providerCustomerId: "cus_123",
        userId: "user-1",
        plan: "pro_monthly",
        status: "active",
        currentPeriodEnd: "2026-10-14T12:00:00.000Z",
        cancelAtPeriodEnd: false,
        occurredAt: "2026-09-14T11:00:00.000Z",
      },
    })
  })

  it("falls back to product.metadata.plan when the product id doesn't match either configured env id", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    const body = JSON.stringify({
      type: "subscription.active",
      timestamp: timestamp.toISOString(),
      data: baseSubscription({ productId: "prod_rotated", product: { metadata: { plan: "pro_yearly" } } }),
    })
    const headers = signHeaders(body, { id: "evt_4" }) // sign with "now"; occurredAt comes from the body's own timestamp field
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toMatchObject({ subscription: { plan: "pro_yearly" } })
  })

  it("resolves userId from checkout metadata when the customer has no external id", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    const body = JSON.stringify({
      type: "subscription.active",
      timestamp: timestamp.toISOString(),
      data: baseSubscription({ customer: { id: "cus_123", externalId: null, metadata: {} }, metadata: { user_id: "user-from-metadata" } }),
    })
    const headers = signHeaders(body, { id: "evt_5" }) // sign with "now"; occurredAt comes from the body's own timestamp field
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toMatchObject({ subscription: { userId: "user-from-metadata" } })
  })

  it("maps past_due/unpaid provider status to our normalized past_due", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    const body = JSON.stringify({
      type: "subscription.past_due",
      timestamp: timestamp.toISOString(),
      data: baseSubscription({ status: "past_due" }),
    })
    const headers = signHeaders(body, { id: "evt_6" }) // sign with "now"; occurredAt comes from the body's own timestamp field
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toMatchObject({ subscription: { status: "past_due" } })
  })

  it("maps a canceled provider status to our normalized canceled", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    const body = JSON.stringify({
      type: "subscription.revoked",
      timestamp: timestamp.toISOString(),
      data: baseSubscription({ status: "canceled" }),
    })
    const headers = signHeaders(body, { id: "evt_7" }) // sign with "now"; occurredAt comes from the body's own timestamp field
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => WEBHOOK_SECRET)

    const result = provider.parseWebhook(body, headers)

    expect(result).toMatchObject({ subscription: { status: "canceled" } })
  })
})

describe("PolarBillingProvider.fetchSubscription", () => {
  it("fetches the current subscription state and normalizes it", async () => {
    const client = fakeClient()
    ;(client.subscriptions.get as ReturnType<typeof vi.fn>).mockResolvedValue(baseSubscription())
    const provider = new PolarBillingProvider(client, ENV, () => "whsec")

    const result = await provider.fetchSubscription("sub_123")

    expect(client.subscriptions.get).toHaveBeenCalledWith({ id: "sub_123" })
    expect(result).toMatchObject({ providerSubscriptionId: "sub_123", plan: "pro_monthly", status: "active" })
  })
})
