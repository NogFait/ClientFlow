-- effective_plan() grace-window regression suite (spec: subscription-lifecycle
-- "Renewal fails, enters grace" / "Payment recovered within grace" / "Grace
-- expires without recovery"; design §4 state machine). CRITICAL gap flagged by
-- sdd/saas-conversion/verify-report-m1 (#1132): the
-- `status = 'past_due' AND now() < s.grace_until` branch in
-- supabase/migrations/20260914182000_entitlements.sql had zero test coverage.
-- LOCAL ONLY for scenarios that touch clientes/proyectos INSERT — this file
-- ENABLEs the (prod-disabled) limit trigger inside its own transaction, same
-- pattern as limit_trigger_test.sql; the transaction rolls back, leaving the
-- trigger disabled for every other run.
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(22);

ALTER TABLE public.clientes ENABLE TRIGGER check_plan_limit_clientes;
ALTER TABLE public.proyectos ENABLE TRIGGER check_plan_limit_proyectos;

-- Scenario 1: past_due, grace_until in the future (3 days out) -------------
-- Renewal failed but the 7-day grace window hasn't elapsed yet: Pro must
-- still be in effect (design §4 "Payment recovered within grace" precondition).
INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999901', 'grace-active@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'past_due', grace_until = now() + interval '3 days'
 WHERE user_id = '99999999-9999-9999-9999-999999999901';

SELECT is(
  (SELECT plan_code FROM public.effective_plan('99999999-9999-9999-9999-999999999901')),
  'pro_monthly', 'grace active: effective_plan() resolves to pro_monthly during grace'
);
SELECT is(
  (SELECT status::text FROM public.effective_plan('99999999-9999-9999-9999-999999999901')),
  'past_due', 'grace active: effective_plan() still reports the raw past_due status'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999901', true);

SELECT is((SELECT public.get_entitlements() ->> 'plan'), 'pro_monthly', 'grace active: get_entitlements() plan is pro_monthly');
SELECT is((SELECT public.get_entitlements() ->> 'status'), 'past_due', 'grace active: get_entitlements() status is past_due (for UI grace messaging)');
SELECT is((SELECT public.get_entitlements() -> 'limits' ->> 'clientes'), NULL, 'grace active: get_entitlements() clientes limit is unlimited (null)');

RESET ROLE;

INSERT INTO public.clientes (user_id, name)
SELECT '99999999-9999-9999-9999-999999999901', 'C' || g
FROM generate_series(1, 3) g;

SELECT lives_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('99999999-9999-9999-9999-999999999901', 'C4') $$,
  'grace active: 4th cliente insert succeeds (Pro is in effect during grace)'
);
SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '99999999-9999-9999-9999-999999999901'),
  4, 'grace active: clientes count is 4'
);

-- Scenario 2: past_due, grace_until in the past (expired 1 day ago) --------
INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999902', 'grace-expired@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'past_due', grace_until = now() - interval '1 day'
 WHERE user_id = '99999999-9999-9999-9999-999999999902';

SELECT is(
  (SELECT plan_code FROM public.effective_plan('99999999-9999-9999-9999-999999999902')),
  'free', 'grace expired: effective_plan() falls back to free once grace_until has passed'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999902', true);

SELECT is((SELECT public.get_entitlements() ->> 'plan'), 'free', 'grace expired: get_entitlements() plan is free');
SELECT is((SELECT public.get_entitlements() -> 'limits' ->> 'clientes'), '3', 'grace expired: get_entitlements() clientes limit is back to 3');

RESET ROLE;

INSERT INTO public.clientes (user_id, name)
SELECT '99999999-9999-9999-9999-999999999902', 'C' || g
FROM generate_series(1, 3) g;

SELECT throws_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('99999999-9999-9999-9999-999999999902', 'C4') $$,
  'P0001', 'LIMIT_EXCEEDED',
  'grace expired: 4th cliente raises LIMIT_EXCEEDED once back on free'
);
SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '99999999-9999-9999-9999-999999999902'),
  3, 'grace expired: clientes count stays at 3 after the blocked insert'
);

-- Scenario 3: past_due, grace_until IS NULL ---------------------------------
-- Documents the SQL's three-valued-logic behavior explicitly: `now() < NULL`
-- evaluates to NULL/unknown, which CASE WHEN treats as false, so a past_due
-- row with no grace_until set behaves exactly like an expired grace window
-- (free), never like an active grace window. NULL grace = no grace.
INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999903', 'grace-null@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'past_due', grace_until = NULL
 WHERE user_id = '99999999-9999-9999-9999-999999999903';

SELECT is(
  (SELECT plan_code FROM public.effective_plan('99999999-9999-9999-9999-999999999903')),
  'free', 'grace null: effective_plan() treats a NULL grace_until as no grace (free)'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999903', true);

SELECT is((SELECT public.get_entitlements() ->> 'plan'), 'free', 'grace null: get_entitlements() plan is free');
SELECT is((SELECT public.get_entitlements() -> 'limits' ->> 'clientes'), '3', 'grace null: get_entitlements() clientes limit is 3 (free)');

RESET ROLE;

-- Scenario 4: canceled / cancel_at_period_end state-machine boundary -------
-- Design §4: a *scheduled* cancellation keeps `status='active'` with
-- `cancel_at_period_end=true` (access continues until current_period_end);
-- the enum value `status='canceled'` is reserved for the terminal
-- `subscription.revoked` transition, which is "effective Free" regardless of
-- current_period_end. These assertions prove effective_plan() matches that
-- state machine as-is — no SQL change needed, this is coverage only.
INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999904', 'canceled-future-period@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'canceled', current_period_end = now() + interval '10 days'
 WHERE user_id = '99999999-9999-9999-9999-999999999904';

SELECT is(
  (SELECT plan_code FROM public.effective_plan('99999999-9999-9999-9999-999999999904')),
  'free', 'canceled (terminal) with future current_period_end: still effective Free — revocation is immediate, not period-end-gated'
);

INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999905', 'canceled-past-period@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'canceled', current_period_end = now() - interval '10 days'
 WHERE user_id = '99999999-9999-9999-9999-999999999905';

SELECT is(
  (SELECT plan_code FROM public.effective_plan('99999999-9999-9999-9999-999999999905')),
  'free', 'canceled (terminal) with past current_period_end: effective Free'
);

INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999906', 'cancel-scheduled@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'active', cancel_at_period_end = true,
       current_period_end = now() + interval '10 days'
 WHERE user_id = '99999999-9999-9999-9999-999999999906';

SELECT is(
  (SELECT plan_code FROM public.effective_plan('99999999-9999-9999-9999-999999999906')),
  'pro_monthly', 'cancel scheduled (status still active, cancel_at_period_end=true): keeps Pro until current_period_end'
);

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '99999999-9999-9999-9999-999999999906', true);

SELECT is((SELECT public.get_entitlements() ->> 'cancel_at_period_end'), 'true', 'cancel scheduled: get_entitlements() surfaces cancel_at_period_end=true for UI messaging');

RESET ROLE;

-- Scenario 5: downgrade via grace expiry keeps data, blocks only INSERT ----
-- Same "data survives, only new INSERTs blocked" invariant as
-- limit_trigger_test.sql's explicit-downgrade case, but reached via grace
-- expiry instead of an admin/webhook plan_code change.
INSERT INTO auth.users (id, email) VALUES
  ('99999999-9999-9999-9999-999999999907', 'grace-downgrade-data@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'active'
 WHERE user_id = '99999999-9999-9999-9999-999999999907';

INSERT INTO public.clientes (user_id, name)
SELECT '99999999-9999-9999-9999-999999999907', 'C' || g
FROM generate_series(1, 5) g;

-- Renewal fails and the grace window has already elapsed by the time anyone
-- looks: status flips to past_due with a grace_until already in the past.
UPDATE public.subscriptions
   SET status = 'past_due', grace_until = now() - interval '1 day'
 WHERE user_id = '99999999-9999-9999-9999-999999999907';

SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '99999999-9999-9999-9999-999999999907'),
  5, 'grace downgrade: all 5 over-limit rows remain readable after grace expires'
);
WITH upd AS (
  UPDATE public.clientes SET name = 'renamed'
   WHERE user_id = '99999999-9999-9999-9999-999999999907' AND name = 'C1'
  RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 1, 'grace downgrade: updating an existing over-limit row still succeeds');
SELECT throws_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('99999999-9999-9999-9999-999999999907', 'C-new') $$,
  'P0001', 'LIMIT_EXCEEDED',
  'grace downgrade: new insert after grace expiry raises LIMIT_EXCEEDED'
);

SELECT * FROM finish();
ROLLBACK;
