-- Billing schema RLS regression suite (spec: data-isolation-rls R2, plan-catalog-entitlements).
-- Asserts: subscriptions is SELECT-own-only (no client writes), billing_events is fully
-- inaccessible to clients (service-role only), plans is readable by all authenticated users.
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(10);

-- Fixture users -------------------------------------------------------
INSERT INTO auth.users (id, email)
VALUES
  ('33333333-3333-3333-3333-333333333333', 'billing-user-a@clientflow.test'),
  ('44444444-4444-4444-4444-444444444444', 'billing-user-b@clientflow.test');

-- Fixture rows, seeded as postgres (bypasses RLS) --------------------------
-- Note: the signup trigger (migration `_signup_provisioning`) already inserted a
-- 'free' subscriptions row for each user above on the auth.users INSERT — this is
-- an idempotent upsert so the test stays correct whether or not that trigger exists.
INSERT INTO public.subscriptions (user_id, plan_code) VALUES
  ('33333333-3333-3333-3333-333333333333', 'free'),
  ('44444444-4444-4444-4444-444444444444', 'free')
ON CONFLICT (user_id) DO UPDATE SET plan_code = excluded.plan_code;

INSERT INTO public.billing_events (provider, provider_event_id, type, payload) VALUES
  ('polar', 'evt_fixture_1', 'subscription.active', '{}'::jsonb);

-- Authenticate as user B ------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '44444444-4444-4444-4444-444444444444', true);

-- subscriptions ---------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.subscriptions WHERE user_id = '33333333-3333-3333-3333-333333333333'),
  0, 'subscriptions: user B cannot SELECT user A''s row'
);
SELECT is(
  (SELECT count(*)::int FROM public.subscriptions WHERE user_id = '44444444-4444-4444-4444-444444444444'),
  1, 'subscriptions: user B can SELECT their own row'
);
WITH upd AS (
  UPDATE public.subscriptions SET status = 'active'
  WHERE user_id = '44444444-4444-4444-4444-444444444444' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'subscriptions: user B cannot UPDATE their own row (no policy grants it)');

-- billing_events ----------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.billing_events),
  0, 'billing_events: authenticated SELECT returns zero rows'
);
SELECT throws_ok(
  $$ INSERT INTO public.billing_events (provider, provider_event_id, type, payload)
     VALUES ('polar', 'evt_from_client', 'subscription.active', '{}'::jsonb) $$,
  '42501',
  NULL,
  'billing_events: authenticated INSERT is rejected by RLS'
);
WITH upd AS (
  UPDATE public.billing_events SET error = 'hacked' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'billing_events: authenticated UPDATE affects zero rows');
WITH del AS (
  DELETE FROM public.billing_events RETURNING 1
)
SELECT is((SELECT count(*)::int FROM del), 0, 'billing_events: authenticated DELETE affects zero rows');

-- plans ---------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.plans WHERE code = 'free'),
  1, 'plans: authenticated user can SELECT the free plan'
);
SELECT is(
  (SELECT count(*)::int FROM public.plans WHERE code = 'pro_monthly'),
  1, 'plans: authenticated user can SELECT the pro_monthly plan'
);
SELECT is(
  (SELECT count(*)::int FROM public.plans WHERE code = 'pro_yearly'),
  1, 'plans: authenticated user can SELECT the pro_yearly plan'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
