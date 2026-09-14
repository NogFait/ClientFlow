import type { PlanCode } from "../types"

// Domain-owned port (hexagonal architecture) — no SDK import here. The Polar
// adapter (server-only, api/_lib/polar/PolarBillingProvider.ts) implements
// this interface; the domain reducer (domain/subscription.ts) and Vercel
// Functions (api/billing/*) depend only on these types.
// Design: sdd/saas-conversion/design §2.

export type { PlanCode }
export type PaidPlanCode = Exclude<PlanCode, "free">

export interface NormalizedSubscription {
  providerSubscriptionId: string
  providerCustomerId: string
  // null when the checkout metadata / customer external_id could not be
  // resolved to a Supabase user — the caller must still record the event.
  userId: string | null
  plan: PaidPlanCode
  status: "active" | "past_due" | "canceled" | "revoked"
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  // ISO timestamp of the underlying provider event — used by the reducer to
  // reject stale/out-of-order webhook deliveries without overwriting newer state.
  occurredAt: string
}

export type BillingEvent =
  | { kind: "subscription"; eventId: string; type: string; subscription: NormalizedSubscription }
  | { kind: "ignored"; eventId: string; type: string }

// Thrown by parseWebhook when the provider signature does not verify.
export class InvalidSignatureError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "InvalidSignatureError"
  }
}

export interface BillingProvider {
  readonly id: "polar" | "mercadopago"
  ensureCustomer(input: { userId: string; email: string }): Promise<{ customerId: string }>
  createCheckout(input: {
    customerId: string
    userId: string
    plan: PaidPlanCode
    successUrl: string
  }): Promise<{ url: string }>
  createPortalSession(input: { customerId: string; returnUrl: string }): Promise<{ url: string }>
  // Throws InvalidSignatureError when the signature does not verify.
  parseWebhook(rawBody: string, headers: Record<string, string | undefined>): BillingEvent
  // Fetch-then-apply: always returns the CURRENT provider state for the
  // subscription, so out-of-order webhook deliveries can't regress it.
  fetchSubscription(providerSubscriptionId: string): Promise<NormalizedSubscription>
}
