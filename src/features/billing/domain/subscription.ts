import type { PlanCode, SubscriptionStatus } from "../types"
import type { NormalizedSubscription } from "../ports/BillingProvider"

// Pure state machine — design §4, authoritative semantics per
// sdd/saas-conversion/m1-done: a *scheduled* cancellation keeps status
// "active" with cancel_at_period_end=true (Pro until current_period_end);
// only an explicit "revoked" event (or the provider itself reporting the
// subscription as fully canceled) is terminal and immediate.
//
// `updatedAt` doubles as "timestamp of the last applied provider event" so
// out-of-order webhook deliveries can be rejected without a extra schema
// column: the persistence layer must write the reducer's returned
// `updatedAt` (which equals the event's `occurredAt`), not wall-clock time.
export interface SubscriptionRow {
  userId: string
  planCode: PlanCode
  status: SubscriptionStatus
  provider: "polar" | "mercadopago" | null
  providerCustomerId: string | null
  providerSubscriptionId: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  graceUntil: string | null
  updatedAt: string
}

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000

export function applySubscriptionEvent(
  row: SubscriptionRow,
  sub: NormalizedSubscription,
  now: Date
): SubscriptionRow {
  // Out-of-order / duplicate guard: never let an older-or-equal event regress
  // (or redundantly re-touch) state that a newer event already applied.
  if (new Date(sub.occurredAt).getTime() <= new Date(row.updatedAt).getTime()) {
    return row
  }

  const base: SubscriptionRow = { ...row, updatedAt: sub.occurredAt }

  switch (sub.status) {
    case "active":
      return {
        ...base,
        planCode: sub.plan,
        status: "active",
        provider: "polar",
        providerCustomerId: sub.providerCustomerId,
        providerSubscriptionId: sub.providerSubscriptionId,
        currentPeriodEnd: sub.currentPeriodEnd,
        cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
        graceUntil: null,
      }

    case "past_due":
      return {
        ...base,
        status: "past_due",
        // Coalesce: a repeated past_due delivery must not push the deadline out.
        graceUntil: row.graceUntil ?? new Date(now.getTime() + GRACE_PERIOD_MS).toISOString(),
      }

    case "canceled":
    case "revoked":
      // Both are terminal: "canceled" here means the provider itself reports
      // the subscription as fully ended (not merely flagged for cancellation
      // — that case arrives as status "active" + cancelAtPeriodEnd=true).
      // "revoked" is Polar's explicit benefit-revocation event. Either way,
      // access ends immediately; plan_code is preserved for history.
      return {
        ...base,
        status: "canceled",
        cancelAtPeriodEnd: false,
        graceUntil: null,
      }

    default:
      // Defensive: an untyped JSON boundary could smuggle in a status the
      // port type doesn't allow. Leave state untouched rather than guess.
      return row
  }
}
