-- M2: apply_subscription_change RPC — atomically persists a webhook-driven
-- subscription update: marks the billing_events row processed AND upserts
-- the subscriptions row, in one transaction (design §3 webhook steps 5-6;
-- spec `billing-webhooks` "2xx only after durable persistence" / "DB write
-- failure triggers retry"). The webhook handler (api/billing/webhook.ts)
-- computes the new field values in TS via the pure `applySubscriptionEvent`
-- reducer (src/features/billing/domain/subscription.ts) and passes them here
-- as plain params — this function does no state-machine logic itself, only
-- persistence.
--
-- SECURITY DEFINER, service-role only: EXECUTE is revoked from PUBLIC (and
-- therefore from authenticated/anon, which are members of PUBLIC) so a
-- client can never set their own plan/status directly. service_role bypasses
-- this like it bypasses RLS on billing_events (same convention as that
-- table's "no policies at all" comment in the billing_schema migration).

CREATE OR REPLACE FUNCTION public.apply_subscription_change(
  p_billing_event_id bigint,
  p_user_id uuid,
  p_plan_code text,
  p_status public.subscription_status,
  p_provider text,
  p_provider_customer_id text,
  p_provider_subscription_id text,
  p_current_period_end timestamp with time zone,
  p_cancel_at_period_end boolean,
  p_grace_until timestamp with time zone,
  p_updated_at timestamp with time zone
)
  RETURNS void
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  -- Mark the event processed FIRST, then upsert the subscription. Both
  -- statements share this function call's implicit transaction: if the
  -- upsert below fails (e.g. an invalid plan_code violating the
  -- subscriptions_plan_code_fkey), Postgres rolls back the processed_at
  -- write too, so a partially-applied event never exists — the caller sees
  -- a plain exception and returns 500 so Polar retries the whole delivery.
  UPDATE public.billing_events
  SET processed_at = now()
  WHERE id = p_billing_event_id;

  INSERT INTO public.subscriptions (
    user_id, plan_code, status, provider, provider_customer_id,
    provider_subscription_id, current_period_end, cancel_at_period_end,
    grace_until, updated_at
  ) VALUES (
    p_user_id, p_plan_code, p_status, p_provider, p_provider_customer_id,
    p_provider_subscription_id, p_current_period_end, p_cancel_at_period_end,
    p_grace_until, p_updated_at
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_code                = excluded.plan_code,
    status                   = excluded.status,
    provider                 = excluded.provider,
    provider_customer_id     = excluded.provider_customer_id,
    provider_subscription_id = excluded.provider_subscription_id,
    current_period_end       = excluded.current_period_end,
    cancel_at_period_end     = excluded.cancel_at_period_end,
    grace_until               = excluded.grace_until,
    updated_at                = excluded.updated_at;
END;
$function$;

-- Supabase's default privileges grant EXECUTE on new functions to
-- anon/authenticated/service_role at creation time — "REVOKE ... FROM
-- PUBLIC" alone does not remove those already-materialized per-role grants,
-- so anon/authenticated must be revoked explicitly (service_role is
-- intentionally left untouched: it's the only caller, from the webhook
-- handler).
REVOKE ALL ON FUNCTION public.apply_subscription_change(
  bigint, uuid, text, public.subscription_status, text, text, text,
  timestamp with time zone, boolean, timestamp with time zone, timestamp with time zone
) FROM PUBLIC, anon, authenticated;
