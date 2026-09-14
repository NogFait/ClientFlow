-- Signup provisioning regression suite (spec: auth delta "Signup provisions a Free
-- subscription"; subscription-lifecycle "Every user has a subscription row from creation").
-- Asserts: a new auth.users INSERT provisions exactly one subscriptions row with
-- plan_code='free', and the invariant "every auth.users row has a subscriptions row"
-- holds (covers both the trigger and the historical backfill).
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(3);

-- New signup provisions exactly one Free subscription row ----------------
INSERT INTO auth.users (id, email) VALUES
  ('55555555-5555-5555-5555-555555555555', 'new-signup@clientflow.test');

SELECT is(
  (SELECT count(*)::int FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555555'),
  1, 'signup: exactly one subscriptions row is created for a new user'
);
SELECT is(
  (SELECT plan_code FROM public.subscriptions WHERE user_id = '55555555-5555-5555-5555-555555555555'),
  'free', 'signup: the provisioned row defaults to plan_code=free'
);

-- Invariant: no auth.users row exists without a matching subscriptions row
-- (holds for the just-inserted user via the trigger, and for any pre-existing
-- user via the migration's one-time backfill).
SELECT is(
  (SELECT count(*)::int FROM auth.users u
     LEFT JOIN public.subscriptions s ON s.user_id = u.id
    WHERE s.user_id IS NULL),
  0, 'no auth.users row exists without a subscriptions row'
);

SELECT * FROM finish();
ROLLBACK;
