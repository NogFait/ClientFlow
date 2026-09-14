import { describe, expect, it } from "vitest"
import { applySubscriptionEvent } from "./subscription"
import type { NormalizedSubscription } from "../ports/BillingProvider"
import type { SubscriptionRow } from "./subscription"

const NOW = new Date("2026-09-14T12:00:00.000Z")

function freeRow(overrides: Partial<SubscriptionRow> = {}): SubscriptionRow {
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

function sub(overrides: Partial<NormalizedSubscription> = {}): NormalizedSubscription {
  return {
    providerSubscriptionId: "sub_123",
    providerCustomerId: "cus_123",
    userId: "user-1",
    plan: "pro_monthly",
    status: "active",
    currentPeriodEnd: "2026-10-14T12:00:00.000Z",
    cancelAtPeriodEnd: false,
    occurredAt: "2026-09-14T11:00:00.000Z",
    ...overrides,
  }
}

describe("applySubscriptionEvent", () => {
  it("free -> active: first upgrade sets plan, provider ids, period end, clears grace", () => {
    const result = applySubscriptionEvent(freeRow(), sub(), NOW)

    expect(result).toMatchObject({
      planCode: "pro_monthly",
      status: "active",
      provider: "polar",
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      currentPeriodEnd: "2026-10-14T12:00:00.000Z",
      cancelAtPeriodEnd: false,
      graceUntil: null,
    })
  })

  it("active -> active: renewal/plan-change updates plan and period end", () => {
    const active = freeRow({
      planCode: "pro_monthly",
      status: "active",
      provider: "polar",
      providerCustomerId: "cus_123",
      providerSubscriptionId: "sub_123",
      currentPeriodEnd: "2026-10-14T12:00:00.000Z",
      updatedAt: "2026-09-14T11:00:00.000Z",
    })
    const result = applySubscriptionEvent(
      active,
      sub({ plan: "pro_yearly", currentPeriodEnd: "2027-09-14T12:00:00.000Z", occurredAt: "2026-09-14T13:00:00.000Z" }),
      NOW
    )

    expect(result).toMatchObject({ planCode: "pro_yearly", status: "active", currentPeriodEnd: "2027-09-14T12:00:00.000Z" })
  })

  it("active -> active with cancel_at_period_end=true (scheduled cancellation)", () => {
    const active = freeRow({ planCode: "pro_monthly", status: "active", updatedAt: "2026-09-14T11:00:00.000Z" })
    const result = applySubscriptionEvent(active, sub({ cancelAtPeriodEnd: true, occurredAt: "2026-09-14T13:00:00.000Z" }), NOW)

    expect(result).toMatchObject({ status: "active", cancelAtPeriodEnd: true })
  })

  it("active(cancel_at_period_end=true) -> active with flag cleared (uncanceled)", () => {
    const scheduled = freeRow({
      planCode: "pro_monthly",
      status: "active",
      cancelAtPeriodEnd: true,
      updatedAt: "2026-09-14T13:00:00.000Z",
    })
    const result = applySubscriptionEvent(
      scheduled,
      sub({ cancelAtPeriodEnd: false, occurredAt: "2026-09-14T14:00:00.000Z" }),
      NOW
    )

    expect(result).toMatchObject({ status: "active", cancelAtPeriodEnd: false })
  })

  it("active -> past_due: renewal failure starts a 7-day grace window from `now`", () => {
    const active = freeRow({ planCode: "pro_monthly", status: "active", updatedAt: "2026-09-14T11:00:00.000Z" })
    const result = applySubscriptionEvent(
      active,
      sub({ status: "past_due", occurredAt: "2026-09-14T13:00:00.000Z" }),
      NOW
    )

    expect(result.status).toBe("past_due")
    expect(result.graceUntil).toBe(new Date(NOW.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString())
  })

  it("past_due -> past_due: a second past_due event does not push the grace deadline out", () => {
    const pastDue = freeRow({
      planCode: "pro_monthly",
      status: "past_due",
      graceUntil: "2026-09-15T00:00:00.000Z",
      updatedAt: "2026-09-14T13:00:00.000Z",
    })
    const result = applySubscriptionEvent(
      pastDue,
      sub({ status: "past_due", occurredAt: "2026-09-14T15:00:00.000Z" }),
      NOW
    )

    expect(result.graceUntil).toBe("2026-09-15T00:00:00.000Z")
  })

  it("past_due -> active: payment recovered clears the grace deadline", () => {
    const pastDue = freeRow({
      planCode: "pro_monthly",
      status: "past_due",
      graceUntil: "2026-09-15T00:00:00.000Z",
      updatedAt: "2026-09-14T13:00:00.000Z",
    })
    const result = applySubscriptionEvent(pastDue, sub({ status: "active", occurredAt: "2026-09-14T15:00:00.000Z" }), NOW)

    expect(result).toMatchObject({ status: "active", graceUntil: null })
  })

  it("active -> canceled: revoked event is terminal and immediate regardless of period end", () => {
    const active = freeRow({
      planCode: "pro_monthly",
      status: "active",
      cancelAtPeriodEnd: true,
      currentPeriodEnd: "2026-12-14T00:00:00.000Z",
      updatedAt: "2026-09-14T11:00:00.000Z",
    })
    const result = applySubscriptionEvent(
      active,
      sub({ status: "revoked", occurredAt: "2026-09-14T13:00:00.000Z" }),
      NOW
    )

    expect(result).toMatchObject({ status: "canceled", cancelAtPeriodEnd: false, graceUntil: null })
    // Plan code history is preserved (design §4) — only status flips.
    expect(result.planCode).toBe("pro_monthly")
  })

  it("past_due -> canceled: provider reports the subscription itself as canceled (not merely revoked)", () => {
    const pastDue = freeRow({
      planCode: "pro_monthly",
      status: "past_due",
      graceUntil: "2026-09-21T00:00:00.000Z",
      updatedAt: "2026-09-14T13:00:00.000Z",
    })
    const result = applySubscriptionEvent(
      pastDue,
      sub({ status: "canceled", occurredAt: "2026-09-14T15:00:00.000Z" }),
      NOW
    )

    expect(result).toMatchObject({ status: "canceled", graceUntil: null })
  })

  it("ignores an event older than the last applied one (out-of-order delivery)", () => {
    const active = freeRow({
      planCode: "pro_monthly",
      status: "active",
      currentPeriodEnd: "2027-09-14T12:00:00.000Z",
      updatedAt: "2026-09-14T15:00:00.000Z",
    })
    const stale = sub({ currentPeriodEnd: "2026-10-14T12:00:00.000Z", occurredAt: "2026-09-14T10:00:00.000Z" })

    const result = applySubscriptionEvent(active, stale, NOW)

    expect(result).toEqual(active)
  })

  it("ignores an event with the exact same timestamp as the last applied one (dedup safety)", () => {
    const active = freeRow({ status: "active", updatedAt: "2026-09-14T15:00:00.000Z" })
    const duplicate = sub({ occurredAt: "2026-09-14T15:00:00.000Z", currentPeriodEnd: "2099-01-01T00:00:00.000Z" })

    const result = applySubscriptionEvent(active, duplicate, NOW)

    expect(result).toEqual(active)
  })

  it("leaves the row unchanged for an unrecognized normalized status (defensive default)", () => {
    const active = freeRow({ status: "active", updatedAt: "2026-09-14T11:00:00.000Z" })
    // Cast through unknown: the port type only allows 4 values, but a runtime
    // payload from an untyped JSON boundary could still smuggle something else in.
    const weird = sub({ occurredAt: "2026-09-14T13:00:00.000Z", status: "trialing" as unknown as "active" })

    const result = applySubscriptionEvent(active, weird, NOW)

    expect(result).toEqual(active)
  })
})
