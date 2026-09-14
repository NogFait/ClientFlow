import type { SupabaseClient } from "@supabase/supabase-js"
import type { SubscriptionRow } from "../../src/features/billing/domain/subscription"

// Persistence layer shared by the checkout/portal/webhook handlers — keeps
// them free of raw supabase-js query-builder chains so their own tests can
// use a plain in-memory fake instead of mocking the chain (mock-hygiene:
// extract-before-mock). This module is the one place that knows the
// subscriptions/billing_events column names.

export interface RecordBillingEventInput {
  provider: string
  providerEventId: string
  type: string
  payload: unknown
}

export interface RecordBillingEventResult {
  id: number
  alreadyProcessed: boolean
}

export interface BillingRepo {
  getSubscriptionRow(userId: string): Promise<SubscriptionRow | null>
  setProviderCustomerId(userId: string, provider: "polar" | "mercadopago", providerCustomerId: string): Promise<void>
  findUserIdByProviderCustomerId(providerCustomerId: string): Promise<string | null>
  // Idempotent record: a fresh event returns alreadyProcessed=false. A
  // duplicate (same provider + provider_event_id) that was already fully
  // processed returns alreadyProcessed=true (caller should no-op with 200).
  // A duplicate that was recorded but never successfully processed (e.g. a
  // prior attempt 500'd after this insert but before applying) also returns
  // alreadyProcessed=false, so Polar's retry gets a real second attempt.
  recordBillingEvent(input: RecordBillingEventInput): Promise<RecordBillingEventResult>
  // Marks a billing_events row processed without touching subscriptions —
  // used for "ignored" events and for a fetch-then-apply result that turned
  // out to be a no-op (out-of-order/stale delivery): the event still must
  // not be reprocessed forever, but there is no subscription state to write.
  markEventProcessed(billingEventId: number): Promise<void>
  applySubscriptionChange(input: { billingEventId: number; row: SubscriptionRow }): Promise<void>
}

function throwIfError(error: { message?: string } | null | undefined): void {
  if (error) throw new Error(error.message ?? "Unknown Supabase error")
}

export function createSupabaseBillingRepo(supabaseAdmin: SupabaseClient): BillingRepo {
  return {
    async getSubscriptionRow(userId) {
      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select(
          "user_id, plan_code, status, provider, provider_customer_id, provider_subscription_id, current_period_end, cancel_at_period_end, grace_until, updated_at"
        )
        .eq("user_id", userId)
        .maybeSingle()
      throwIfError(error)
      if (!data) return null

      const row = data as Record<string, unknown>
      return {
        userId: row.user_id as string,
        planCode: row.plan_code as SubscriptionRow["planCode"],
        status: row.status as SubscriptionRow["status"],
        provider: row.provider as SubscriptionRow["provider"],
        providerCustomerId: row.provider_customer_id as string | null,
        providerSubscriptionId: row.provider_subscription_id as string | null,
        currentPeriodEnd: row.current_period_end as string | null,
        cancelAtPeriodEnd: row.cancel_at_period_end as boolean,
        graceUntil: row.grace_until as string | null,
        updatedAt: row.updated_at as string,
      }
    },

    async setProviderCustomerId(userId, provider, providerCustomerId) {
      const { error } = await supabaseAdmin
        .from("subscriptions")
        .update({ provider, provider_customer_id: providerCustomerId })
        .eq("user_id", userId)
      throwIfError(error)
    },

    async findUserIdByProviderCustomerId(providerCustomerId) {
      const { data, error } = await supabaseAdmin
        .from("subscriptions")
        .select("user_id")
        .eq("provider_customer_id", providerCustomerId)
        .maybeSingle()
      throwIfError(error)
      return (data as { user_id: string } | null)?.user_id ?? null
    },

    async recordBillingEvent(input) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("billing_events")
        .insert({
          provider: input.provider,
          provider_event_id: input.providerEventId,
          type: input.type,
          payload: input.payload,
        })
        .select("id")
        .single()

      if (!insertError) {
        return { id: (inserted as { id: number }).id, alreadyProcessed: false }
      }

      const code = (insertError as { code?: string }).code
      if (code !== "23505") throw new Error(insertError.message ?? "Unknown Supabase error")

      // Unique-violation on (provider, provider_event_id): this event was
      // already recorded by a previous delivery. Look it up to decide
      // whether it was ever successfully applied.
      const { data: existing, error: selectError } = await supabaseAdmin
        .from("billing_events")
        .select("id, processed_at")
        .eq("provider", input.provider)
        .eq("provider_event_id", input.providerEventId)
        .single()
      throwIfError(selectError)

      const row = existing as { id: number; processed_at: string | null }
      return { id: row.id, alreadyProcessed: row.processed_at !== null }
    },

    async markEventProcessed(billingEventId) {
      const { error } = await supabaseAdmin
        .from("billing_events")
        .update({ processed_at: new Date().toISOString() })
        .eq("id", billingEventId)
      throwIfError(error)
    },

    async applySubscriptionChange({ billingEventId, row }) {
      const { error } = await supabaseAdmin.rpc("apply_subscription_change", {
        p_billing_event_id: billingEventId,
        p_user_id: row.userId,
        p_plan_code: row.planCode,
        p_status: row.status,
        p_provider: row.provider,
        p_provider_customer_id: row.providerCustomerId,
        p_provider_subscription_id: row.providerSubscriptionId,
        p_current_period_end: row.currentPeriodEnd,
        p_cancel_at_period_end: row.cancelAtPeriodEnd,
        p_grace_until: row.graceUntil,
        p_updated_at: row.updatedAt,
      })
      throwIfError(error)
    },
  }
}
