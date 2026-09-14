import { describe, expect, it, vi, beforeEach } from "vitest"
import type { Polar } from "@polar-sh/sdk"
import { SDKValidationError } from "@polar-sh/sdk/models/errors/sdkvalidationerror.js"
import { WebhookVerificationError } from "@polar-sh/sdk/webhooks"
import { InvalidSignatureError } from "../../../src/features/billing/ports/BillingProvider"
import { PolarBillingProvider } from "./PolarBillingProvider"

const validateEventMock = vi.fn()

vi.mock("@polar-sh/sdk/webhooks", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@polar-sh/sdk/webhooks")>()
  return { ...actual, validateEvent: (...args: unknown[]) => validateEventMock(...args) }
})

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

beforeEach(() => {
  validateEventMock.mockReset()
})

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
  it("throws InvalidSignatureError when the signature does not verify", () => {
    validateEventMock.mockImplementation(() => {
      throw new WebhookVerificationError("bad signature")
    })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    expect(() => provider.parseWebhook("{}", { "webhook-signature": "bad" })).toThrow(InvalidSignatureError)
  })

  it("returns an ignored event for a non-subscription event type", () => {
    validateEventMock.mockReturnValue({ type: "checkout.updated", timestamp: new Date(), data: {} })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_1" })

    expect(result).toEqual({ kind: "ignored", eventId: "evt_1", type: "checkout.updated" })
  })

  it("returns an ignored event when the SDK can't parse an unrecognized event type", () => {
    validateEventMock.mockImplementation(() => {
      throw new SDKValidationError("Unknown event type: future.event", null, {})
    })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_2" })

    expect(result).toEqual({ kind: "ignored", eventId: "evt_2", type: "unknown" })
  })

  it("normalizes a subscription.active event into a subscription BillingEvent", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    validateEventMock.mockReturnValue({ type: "subscription.active", timestamp, data: baseSubscription() })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_3" })

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
    validateEventMock.mockReturnValue({
      type: "subscription.active",
      timestamp,
      data: baseSubscription({ productId: "prod_rotated", product: { metadata: { plan: "pro_yearly" } } }),
    })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_4" })

    expect(result).toMatchObject({ subscription: { plan: "pro_yearly" } })
  })

  it("resolves userId from checkout metadata when the customer has no external id", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    validateEventMock.mockReturnValue({
      type: "subscription.active",
      timestamp,
      data: baseSubscription({ customer: { id: "cus_123", externalId: null, metadata: {} }, metadata: { user_id: "user-from-metadata" } }),
    })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_5" })

    expect(result).toMatchObject({ subscription: { userId: "user-from-metadata" } })
  })

  it("maps past_due/unpaid provider status to our normalized past_due", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    validateEventMock.mockReturnValue({
      type: "subscription.past_due",
      timestamp,
      data: baseSubscription({ status: "past_due" }),
    })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_6" })

    expect(result).toMatchObject({ subscription: { status: "past_due" } })
  })

  it("maps a canceled provider status to our normalized canceled", () => {
    const timestamp = new Date("2026-09-14T11:00:00.000Z")
    validateEventMock.mockReturnValue({
      type: "subscription.revoked",
      timestamp,
      data: baseSubscription({ status: "canceled" }),
    })
    const provider = new PolarBillingProvider(fakeClient(), ENV, () => "whsec")

    const result = provider.parseWebhook("{}", { "webhook-id": "evt_7" })

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
