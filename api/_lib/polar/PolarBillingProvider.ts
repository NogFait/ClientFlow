import type { Polar } from "@polar-sh/sdk"
import { Webhook, WebhookVerificationError } from "standardwebhooks"
import type { PolarEnv } from "../env.js"
import type {
  BillingEvent,
  BillingProvider,
  NormalizedSubscription,
  PaidPlanCode,
} from "../../../src/features/billing/ports/BillingProvider.js"
import { InvalidSignatureError } from "../../../src/features/billing/ports/BillingProvider.js"

// Server-only adapter (design §2). Implements the domain-owned BillingProvider
// port using the real @polar-sh/sdk (v0.49.0) surface — verified against the
// installed package's .d.ts, not from memory:
//   - customers.getExternal({externalId}) / customers.create({externalId,email})
//   - checkouts.create({products:[id], customerId, successUrl, metadata})
//   - customerSessions.create({customerId, returnUrl}) -> {customerPortalUrl}
//   - subscriptions.get({id}) -> Subscription
//
// Webhook signature verification uses `standardwebhooks` DIRECTLY rather than
// @polar-sh/sdk's `validateEvent` (see @polar-sh/sdk@0.49.0 src/webhooks.ts
// L136-141): the SDK does `Buffer.from(secret,"utf-8").toString("base64")`
// before handing the secret to `standardwebhooks`, which assumes a RAW
// secret. Polar's dashboard now issues secrets already in Standard Webhooks
// format (`whsec_<base64>`), and `standardwebhooks` strips that prefix and
// base64-decodes natively — the SDK's extra encoding layer double-encodes it
// and every signature check fails with a real secret (confirmed: 30+ live
// sandbox deliveries all returned 401 invalid_signature). Verifying with
// `new Webhook(secret).verify(...)` directly works for BOTH the new
// `whsec_`-prefixed format and legacy plain base64 secrets. Headers required:
// "webhook-id"/"webhook-signature"/"webhook-timestamp" — standardwebhooks
// lowercases header keys internally, but we also normalize them ourselves to
// read "webhook-id" for the event id (Vercel already lowercases, but tests
// and other runtimes may not).
//
// The webhook secret is injected as a thunk (not resolved eagerly) so that
// constructing this provider for checkout/portal requests never requires
// POLAR_WEBHOOK_SECRET to exist yet (it's only set in M2c).
export class PolarBillingProvider implements BillingProvider {
  readonly id = "polar" as const
  private readonly client: Polar
  private readonly env: PolarEnv
  private readonly getWebhookSecret: () => string

  constructor(client: Polar, env: PolarEnv, getWebhookSecret: () => string) {
    this.client = client
    this.env = env
    this.getWebhookSecret = getWebhookSecret
  }

  async ensureCustomer(input: { userId: string; email: string }): Promise<{ customerId: string }> {
    try {
      const customer = await this.client.customers.getExternal({ externalId: input.userId })
      return { customerId: customer.id }
    } catch (err) {
      if (isResourceNotFound(err)) {
        const created = await this.client.customers.create({ externalId: input.userId, email: input.email })
        return { customerId: created.id }
      }
      throw err
    }
  }

  async createCheckout(input: {
    customerId: string
    userId: string
    plan: PaidPlanCode
    successUrl: string
  }): Promise<{ url: string }> {
    const checkout = await this.client.checkouts.create({
      products: [this.productIdForPlan(input.plan)],
      customerId: input.customerId,
      successUrl: input.successUrl,
      metadata: { user_id: input.userId },
    })
    return { url: checkout.url }
  }

  async createPortalSession(input: { customerId: string; returnUrl: string }): Promise<{ url: string }> {
    const session = await this.client.customerSessions.create({
      customerId: input.customerId,
      returnUrl: input.returnUrl,
    })
    return { url: session.customerPortalUrl }
  }

  parseWebhook(rawBody: string, headers: Record<string, string | undefined>): BillingEvent {
    const cleanHeaders = normalizeHeaders(headers)
    const eventId = cleanHeaders["webhook-id"] ?? ""

    let verified: unknown
    try {
      verified = new Webhook(this.getWebhookSecret()).verify(rawBody, cleanHeaders)
    } catch (err) {
      if (err instanceof WebhookVerificationError) {
        throw new InvalidSignatureError(err.message)
      }
      throw err
    }

    const event = toEventShape(verified)
    if (!event) {
      // Payload didn't carry a recognizable `type` field — acknowledge,
      // don't error (spec `billing-webhooks` "Unrecognized event type").
      return { kind: "ignored", eventId, type: "unknown" }
    }

    if (!event.type.startsWith("subscription.")) {
      return { kind: "ignored", eventId, type: event.type }
    }

    return {
      kind: "subscription",
      eventId,
      type: event.type,
      subscription: this.normalize(event.data as SubscriptionLike, event.timestamp),
    }
  }

  async fetchSubscription(providerSubscriptionId: string): Promise<NormalizedSubscription> {
    const sub = await this.client.subscriptions.get({ id: providerSubscriptionId })
    // No webhook timestamp available for a direct fetch — "now" is always
    // >= any previously-applied event's occurredAt, so it never looks stale.
    return this.normalize(sub, new Date())
  }

  // Accepts a real SDK `Subscription` (from fetchSubscription, real Date
  // fields) OR a raw-JSON webhook payload (from parseWebhook, date fields as
  // ISO strings — standardwebhooks.verify() only JSON.parses, it doesn't run
  // the SDK's model deserialization) — see SubscriptionLike below.
  private normalize(sub: SubscriptionLike, occurredAt: Date): NormalizedSubscription {
    return {
      providerSubscriptionId: sub.id,
      providerCustomerId: sub.customerId,
      userId: resolveUserId(sub),
      plan: this.planCodeFromProduct(sub.productId, sub.product),
      status: mapStatus(sub.status),
      currentPeriodEnd: toIsoOrNull(sub.currentPeriodEnd),
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
      occurredAt: occurredAt.toISOString(),
    }
  }

  private productIdForPlan(plan: PaidPlanCode): string {
    return plan === "pro_monthly" ? this.env.productProMonthly : this.env.productProYearly
  }

  // Primary: match the product id against our env config. Fallback (design
  // §2): the product's own `metadata.plan`, for when product ids rotate
  // without an env update.
  private planCodeFromProduct(productId: string, product: { metadata?: Record<string, unknown> } | undefined): PaidPlanCode {
    if (productId === this.env.productProMonthly) return "pro_monthly"
    if (productId === this.env.productProYearly) return "pro_yearly"

    const metaPlan = product?.metadata?.plan
    if (metaPlan === "pro_monthly" || metaPlan === "pro_yearly") return metaPlan

    throw new Error(`Cannot map Polar product "${productId}" to a plan code`)
  }
}

// The subset of Subscription fields normalize() reads, widened so it works
// for both a real SDK `Subscription` (fetchSubscription) and a raw-JSON
// webhook payload cast at the parseWebhook call site (parseWebhook).
type SubscriptionLike = {
  id: string
  customerId: string
  productId: string
  product?: { metadata?: Record<string, unknown> }
  metadata: Record<string, unknown>
  customer: { externalId?: string | null }
  status: string
  currentPeriodEnd: Date | string | null | undefined
  cancelAtPeriodEnd: boolean
}

function resolveUserId(sub: SubscriptionLike): string | null {
  if (sub.customer.externalId) return sub.customer.externalId
  const fromMetadata = sub.metadata.user_id
  return typeof fromMetadata === "string" ? fromMetadata : null
}

function toIsoOrNull(value: Date | string | null | undefined): string | null {
  if (value === null || value === undefined) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

// Polar's own SubscriptionStatus has no "revoked" value — a benefit
// revocation is a distinct *event type*, not a status. Our reducer already
// treats normalized "canceled" and "revoked" identically (both terminal,
// immediate), so mapping every ended state to "canceled" here is sufficient;
// "revoked" is reserved on the port for adapters where the provider signals
// revocation independently of subscription status.
function mapStatus(status: string): NormalizedSubscription["status"] {
  switch (status) {
    case "active":
    case "trialing":
      return "active"
    case "past_due":
    case "unpaid":
      return "past_due"
    default:
      return "canceled"
  }
}

// Duck-typed check instead of `instanceof ResourceNotFound`: the real SDK
// error's constructor needs a Response/Request httpMeta that's awkward to
// fabricate in tests, but the class always sets this exact literal property.
function isResourceNotFound(err: unknown): boolean {
  return typeof err === "object" && err !== null && (err as { error?: unknown }).error === "ResourceNotFound"
}

// Lowercases keys (Vercel already does this, but standardwebhooks reads
// headers case-sensitively for our own `webhook-id` lookup, and other
// runtimes/tests may hand us mixed-case keys) and drops undefined values.
function normalizeHeaders(headers: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) result[key.toLowerCase()] = value
  }
  return result
}

// standardwebhooks' `verify()` JSON.parses the payload for us and returns it
// as `unknown` — validate the shape ourselves since we no longer have the
// SDK's own event-type switch to lean on. A `timestamp` field that isn't a
// valid date-like value falls back to "now" rather than producing an
// Invalid Date, matching the previous SDK-parsed behavior's Date type.
function toEventShape(verified: unknown): { type: string; timestamp: Date; data: unknown } | null {
  if (typeof verified !== "object" || verified === null) return null
  const record = verified as Record<string, unknown>
  if (typeof record.type !== "string") return null

  const rawTimestamp = record.timestamp
  const timestamp =
    typeof rawTimestamp === "string" || typeof rawTimestamp === "number" ? new Date(rawTimestamp) : new Date()

  return { type: record.type, timestamp, data: record.data }
}
