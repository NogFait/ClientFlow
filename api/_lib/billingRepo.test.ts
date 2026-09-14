import { describe, expect, it, vi } from "vitest"
import type { SupabaseClient } from "@supabase/supabase-js"
import { createSupabaseBillingRepo } from "./billingRepo"

// A minimal fake of supabase-js's chainable query builder: every chain
// method returns the same object (so any call order works), and the object
// itself is thenable so `await builder.update(...).eq(...)` resolves
// directly, matching real supabase-js semantics.
function fakeBuilder(result: { data?: unknown; error?: unknown }) {
  const builder = {
    select: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    maybeSingle: vi.fn(async () => result),
    single: vi.fn(async () => result),
    then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
  }
  return builder
}

function fakeSupabase(fromImpl: (table: string) => ReturnType<typeof fakeBuilder>, rpcImpl?: ReturnType<typeof vi.fn>) {
  return { from: vi.fn(fromImpl), rpc: rpcImpl ?? vi.fn(async () => ({ data: null, error: null })) } as unknown as SupabaseClient
}

describe("getSubscriptionRow", () => {
  it("maps a snake_case DB row into the camelCase SubscriptionRow shape", async () => {
    const row = {
      user_id: "user-1",
      plan_code: "pro_monthly",
      status: "active",
      provider: "polar",
      provider_customer_id: "cus_1",
      provider_subscription_id: "sub_1",
      current_period_end: "2026-10-14T12:00:00.000Z",
      cancel_at_period_end: false,
      grace_until: null,
      updated_at: "2026-09-14T11:00:00.000Z",
    }
    const supabase = fakeSupabase(() => fakeBuilder({ data: row, error: null }))
    const repo = createSupabaseBillingRepo(supabase)

    const result = await repo.getSubscriptionRow("user-1")

    expect(result).toEqual({
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
    })
  })

  it("returns null when the user has no subscriptions row", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ data: null, error: null }))
    const repo = createSupabaseBillingRepo(supabase)

    expect(await repo.getSubscriptionRow("user-none")).toBeNull()
  })
})

describe("setProviderCustomerId", () => {
  it("updates provider and provider_customer_id for the given user", async () => {
    const builder = fakeBuilder({ error: null })
    const supabase = fakeSupabase(() => builder)
    const repo = createSupabaseBillingRepo(supabase)

    await repo.setProviderCustomerId("user-1", "polar", "cus_new")

    expect(builder.update).toHaveBeenCalledWith({ provider: "polar", provider_customer_id: "cus_new" })
    expect(builder.eq).toHaveBeenCalledWith("user_id", "user-1")
  })

  it("throws when the update fails", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ error: { message: "db down" } }))
    const repo = createSupabaseBillingRepo(supabase)

    await expect(repo.setProviderCustomerId("user-1", "polar", "cus_new")).rejects.toThrow(/db down/)
  })
})

describe("findUserIdByProviderCustomerId", () => {
  it("returns the user id when a matching row exists", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ data: { user_id: "user-7" }, error: null }))
    const repo = createSupabaseBillingRepo(supabase)

    expect(await repo.findUserIdByProviderCustomerId("cus_7")).toBe("user-7")
  })

  it("returns null when no row matches", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ data: null, error: null }))
    const repo = createSupabaseBillingRepo(supabase)

    expect(await repo.findUserIdByProviderCustomerId("cus_missing")).toBeNull()
  })
})

describe("recordBillingEvent", () => {
  it("returns the new id and alreadyProcessed=false on a fresh insert", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ data: { id: 42 }, error: null }))
    const repo = createSupabaseBillingRepo(supabase)

    const result = await repo.recordBillingEvent({
      provider: "polar",
      providerEventId: "evt_1",
      type: "subscription.active",
      payload: { a: 1 },
    })

    expect(result).toEqual({ id: 42, alreadyProcessed: false })
  })

  it("looks up the existing row and reports alreadyProcessed=true on a duplicate that was already processed", async () => {
    let call = 0
    const supabase = fakeSupabase(() => {
      call += 1
      if (call === 1) return fakeBuilder({ data: null, error: { code: "23505", message: "duplicate key" } })
      return fakeBuilder({ data: { id: 7, processed_at: "2026-09-14T10:00:00.000Z" }, error: null })
    })
    const repo = createSupabaseBillingRepo(supabase)

    const result = await repo.recordBillingEvent({
      provider: "polar",
      providerEventId: "evt_dup",
      type: "subscription.active",
      payload: {},
    })

    expect(result).toEqual({ id: 7, alreadyProcessed: true })
  })

  it("reports alreadyProcessed=false on a duplicate that was recorded but never successfully processed (retry-safe)", async () => {
    let call = 0
    const supabase = fakeSupabase(() => {
      call += 1
      if (call === 1) return fakeBuilder({ data: null, error: { code: "23505", message: "duplicate key" } })
      return fakeBuilder({ data: { id: 7, processed_at: null }, error: null })
    })
    const repo = createSupabaseBillingRepo(supabase)

    const result = await repo.recordBillingEvent({
      provider: "polar",
      providerEventId: "evt_retry",
      type: "subscription.active",
      payload: {},
    })

    expect(result).toEqual({ id: 7, alreadyProcessed: false })
  })

  it("propagates an unexpected insert error instead of masking it as a duplicate", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ data: null, error: { code: "500", message: "connection reset" } }))
    const repo = createSupabaseBillingRepo(supabase)

    await expect(
      repo.recordBillingEvent({ provider: "polar", providerEventId: "evt_x", type: "t", payload: {} })
    ).rejects.toThrow(/connection reset/)
  })
})

describe("markEventProcessed", () => {
  it("sets processed_at for the given billing_events id", async () => {
    const builder = fakeBuilder({ error: null })
    const supabase = fakeSupabase(() => builder)
    const repo = createSupabaseBillingRepo(supabase)

    await repo.markEventProcessed(5)

    expect(builder.update).toHaveBeenCalledWith(expect.objectContaining({ processed_at: expect.any(String) }))
    expect(builder.eq).toHaveBeenCalledWith("id", 5)
  })

  it("throws when the update fails", async () => {
    const supabase = fakeSupabase(() => fakeBuilder({ error: { message: "db down" } }))
    const repo = createSupabaseBillingRepo(supabase)

    await expect(repo.markEventProcessed(5)).rejects.toThrow(/db down/)
  })
})

describe("applySubscriptionChange", () => {
  it("calls the apply_subscription_change RPC with snake_case params derived from the row", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: null }))
    const supabase = fakeSupabase(() => fakeBuilder({}), rpc)
    const repo = createSupabaseBillingRepo(supabase)

    await repo.applySubscriptionChange({
      billingEventId: 9,
      row: {
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
      },
    })

    expect(rpc).toHaveBeenCalledWith("apply_subscription_change", {
      p_billing_event_id: 9,
      p_user_id: "user-1",
      p_plan_code: "pro_monthly",
      p_status: "active",
      p_provider: "polar",
      p_provider_customer_id: "cus_1",
      p_provider_subscription_id: "sub_1",
      p_current_period_end: "2026-10-14T12:00:00.000Z",
      p_cancel_at_period_end: false,
      p_grace_until: null,
      p_updated_at: "2026-09-14T11:00:00.000Z",
    })
  })

  it("throws when the RPC reports an error (so the caller can 500 and let Polar retry)", async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: "fk violation" } }))
    const supabase = fakeSupabase(() => fakeBuilder({}), rpc)
    const repo = createSupabaseBillingRepo(supabase)

    await expect(
      repo.applySubscriptionChange({
        billingEventId: 9,
        row: {
          userId: "user-1",
          planCode: "pro_monthly",
          status: "active",
          provider: "polar",
          providerCustomerId: "cus_1",
          providerSubscriptionId: "sub_1",
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
          graceUntil: null,
          updatedAt: "2026-09-14T11:00:00.000Z",
        },
      })
    ).rejects.toThrow(/fk violation/)
  })
})
