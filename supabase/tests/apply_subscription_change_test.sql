-- apply_subscription_change() RPC regression suite (spec: billing-webhooks
-- "2xx only after durable persistence" / "DB write failure triggers retry";
-- design §3 webhook steps 5-6). Covers: successful first insert, idempotent
-- re-application (upsert on conflict), atomicity (a failure partway rolls
-- back BOTH statements, not just the one that raised), and that EXECUTE is
-- not granted to authenticated/anon (service-role only).
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(11);

-- Fixture user (signup trigger auto-provisions a 'free' subscriptions row) --
INSERT INTO auth.users (id, email) VALUES
  ('55555555-5555-5555-5555-555555555501', 'apply-change@clientflow.test');

-- Scenario 1: first real application (free -> active) ----------------------
INSERT INTO public.billing_events (provider, provider_event_id, type, payload)
VALUES ('polar', 'evt_apply_1', 'subscription.active', '{}'::jsonb)
RETURNING id AS event1_id \gset

SELECT lives_ok(
  format(
    $$ SELECT public.apply_subscription_change(
         %L, '55555555-5555-5555-5555-555555555501'::uuid, 'pro_monthly', 'active'::public.subscription_status,
         'polar', 'cus_1', 'sub_1', now() + interval '30 days', false, NULL, now()
       ) $$,
    :'event1_id'
  ),
  'apply_subscription_change: first application succeeds'
);

SELECT is(
  (SELECT plan_code FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555501'),
  'pro_monthly', 'subscriptions.plan_code is pro_monthly after applying'
);
SELECT is(
  (SELECT status::text FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555501'),
  'active', 'subscriptions.status is active after applying'
);
SELECT isnt(
  (SELECT processed_at FROM public.billing_events WHERE id = :event1_id),
  NULL, 'billing_events.processed_at is set for the applied event'
);

-- Scenario 2: idempotent re-application (upsert, not duplicate row) --------
INSERT INTO public.billing_events (provider, provider_event_id, type, payload)
VALUES ('polar', 'evt_apply_2', 'subscription.updated', '{}'::jsonb)
RETURNING id AS event2_id \gset

SELECT lives_ok(
  format(
    $$ SELECT public.apply_subscription_change(
         %L, '55555555-5555-5555-5555-555555555501'::uuid, 'pro_yearly', 'active'::public.subscription_status,
         'polar', 'cus_1', 'sub_1_renewed', now() + interval '365 days', false, NULL, now()
       ) $$,
    :'event2_id'
  ),
  'apply_subscription_change: second application (plan change) succeeds'
);
SELECT is(
  (SELECT count(*)::int FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555501'),
  1, 'subscriptions still has exactly one row for this user (upsert, not insert)'
);
SELECT is(
  (SELECT plan_code FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555501'),
  'pro_yearly', 'subscriptions.plan_code reflects the second application'
);

-- Scenario 3: atomicity — a failure partway rolls back BOTH statements -----
-- 'nonexistent_plan' violates subscriptions_plan_code_fkey, raised by the
-- SECOND statement inside the function (the subscriptions upsert). If the
-- function were not atomic, the FIRST statement (marking evt_apply_3
-- processed) would have already committed by itself.
INSERT INTO public.billing_events (provider, provider_event_id, type, payload)
VALUES ('polar', 'evt_apply_3', 'subscription.active', '{}'::jsonb)
RETURNING id AS event3_id \gset

SELECT throws_ok(
  format(
    $$ SELECT public.apply_subscription_change(
         %L, '55555555-5555-5555-5555-555555555501'::uuid, 'nonexistent_plan', 'active'::public.subscription_status,
         'polar', 'cus_1', 'sub_1', now() + interval '30 days', false, NULL, now()
       ) $$,
    :'event3_id'
  ),
  '23503',
  NULL,
  'apply_subscription_change: invalid plan_code raises a foreign_key_violation'
);
SELECT is(
  (SELECT processed_at FROM public.billing_events WHERE id = :event3_id),
  NULL,
  'atomicity: billing_events.processed_at was rolled back along with the failed upsert'
);
SELECT is(
  (SELECT plan_code FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555501'),
  'pro_yearly',
  'atomicity: subscriptions row is untouched by the failed call (still pro_yearly from scenario 2)'
);

-- Scenario 4: service-role only — authenticated cannot call it directly ----
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '55555555-5555-5555-5555-555555555501', true);

SELECT throws_ok(
  $$ SELECT public.apply_subscription_change(
       0::bigint, '55555555-5555-5555-5555-555555555501'::uuid, 'pro_monthly', 'active'::public.subscription_status,
       'polar', 'cus_1', 'sub_1', now(), false, NULL, now()
     ) $$,
  '42501',
  NULL,
  'apply_subscription_change: authenticated role has no EXECUTE grant'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
