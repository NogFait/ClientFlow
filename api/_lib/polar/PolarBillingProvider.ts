import type { Polar } from "@polar-sh/sdk"
import type { Subscription } from "@polar-sh/sdk/models/components/subscription.js"
import { SDKValidationError } from "@polar-sh/sdk/models/errors/sdkvalidationerror.js"
import { validateEvent } from "@polar-sh/sdk/webhooks"
import type { PolarEnv } from "../env"
import type {
  BillingEvent,
  BillingProvider,
  NormalizedSubscription,
  PaidPlanCode,
} from "../../../src/features/billing/ports/BillingProvider"
import { InvalidSignatureError } from "../../../src/features/billing/ports/BillingProvider"

// Server-only adapter (design §2). Implements the domain-owned BillingProvider
// port using the real @polar-sh/sdk (v0.49.0) surface — verified against the
// installed package's .d.ts, not from memory:
//   - customers.getExternal({externalId}) / customers.create({externalId,email})
//   - checkouts.create({products:[id], customerId, successUrl, metadata})
//   - customerSessions.create({customerId, returnUrl}) -> {customerPortalUrl}
//   - subscriptions.get({id}) -> Subscription
//   - validateEvent(rawBody, headers, secret) from "@polar-sh/sdk/webhooks"
//     (standard-webhooks signature check; headers "webhook-id"/"webhook-signature"/
//     "webhook-timestamp", lowercase); throws WebhookVerificationError on a bad
//     signature, SDKValidationError when the payload's `type` isn't one this
//     SDK version recognizes.
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
    const cleanHeaders = stripUndefined(headers)
    const eventId = cleanHeaders["webhook-id"] ?? ""

    let event: { type: string; timestamp: Date; data: unknown }
    try {
      event = validateEvent(rawBody, cleanHeaders, this.getWebhookSecret())
    } catch (err) {
      if (err instanceof SDKValidationError) {
        // A payload type this SDK version doesn't recognize — acknowledge,
        // don't error (spec `billing-webhooks` "Unrecognized event type").
        return { kind: "ignored", eventId, type: "unknown" }
      }
      throw new InvalidSignatureError(err instanceof Error ? err.message : "invalid webhook signature")
    }

    if (!event.type.startsWith("subscription.")) {
      return { kind: "ignored", eventId, type: event.type }
    }

    return {
      kind: "subscription",
      eventId,
      type: event.type,
      subscription: this.normalize(event.data as Subscription, event.timestamp),
    }
  }

  async fetchSubscription(providerSubscriptionId: string): Promise<NormalizedSubscription> {
    const sub = await this.client.subscriptions.get({ id: providerSubscriptionId })
    // No webhook timestamp available for a direct fetch — "now" is always
    // >= any previously-applied event's occurredAt, so it never looks stale.
    return this.normalize(sub, new Date())
  }

  private normalize(sub: Subscription, occurredAt: Date): NormalizedSubscription {
    return {
      providerSubscriptionId: sub.id,
      providerCustomerId: sub.customerId,
      userId: resolveUserId(sub),
      plan: this.planCodeFromProduct(sub.productId, sub.product),
      status: mapStatus(sub.status),
      currentPeriodEnd: sub.currentPeriodEnd ? sub.currentPeriodEnd.toISOString() : null,
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

function resolveUserId(sub: Subscription): string | null {
  if (sub.customer.externalId) return sub.customer.externalId
  const fromMetadata = sub.metadata.user_id
  return typeof fromMetadata === "string" ? fromMetadata : null
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

function stripUndefined(headers: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(headers)) {
    if (value !== undefined) result[key] = value
  }
  return result
}
