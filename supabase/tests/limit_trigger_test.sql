-- check_plan_limit() trigger regression suite (spec: plan-catalog-entitlements
-- scenarios "Free user blocked on 4th cliente/6th proyecto", "Pro user unaffected",
-- "Downgrade keeps over-limit data, blocks new inserts", "Missing subscription
-- defaults to Free"). LOCAL ONLY — this migration ships with the trigger DISABLED
-- (deploy-order gate, see sdd/saas-conversion/apply-progress); this test explicitly
-- ENABLEs it inside the transaction so the real behavior is fully covered, then the
-- transaction rolls back, leaving the trigger disabled for every other run.
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(12);

ALTER TABLE public.clientes ENABLE TRIGGER check_plan_limit_clientes;
ALTER TABLE public.proyectos ENABLE TRIGGER check_plan_limit_proyectos;

-- Free user: blocked on the 4th cliente / 6th proyecto ---------------------
INSERT INTO auth.users (id, email) VALUES
  ('88888888-8888-8888-8888-888888888801', 'limit-free@clientflow.test');
-- subscriptions row auto-provisioned as plan_code='free' by the signup trigger.

INSERT INTO public.clientes (user_id, name) VALUES
  ('88888888-8888-8888-8888-888888888801', 'C1'),
  ('88888888-8888-8888-8888-888888888801', 'C2'),
  ('88888888-8888-8888-8888-888888888801', 'C3');
INSERT INTO public.proyectos (user_id, name) VALUES
  ('88888888-8888-8888-8888-888888888801', 'P1'),
  ('88888888-8888-8888-8888-888888888801', 'P2'),
  ('88888888-8888-8888-8888-888888888801', 'P3'),
  ('88888888-8888-8888-8888-888888888801', 'P4'),
  ('88888888-8888-8888-8888-888888888801', 'P5');

SELECT throws_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('88888888-8888-8888-8888-888888888801', 'C4') $$,
  'P0001', 'LIMIT_EXCEEDED',
  'free user: 4th cliente raises LIMIT_EXCEEDED'
);
SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '88888888-8888-8888-8888-888888888801'),
  3, 'free user: clientes count stays at 3 after the blocked insert'
);
SELECT throws_ok(
  $$ INSERT INTO public.proyectos (user_id, name) VALUES ('88888888-8888-8888-8888-888888888801', 'P6') $$,
  'P0001', 'LIMIT_EXCEEDED',
  'free user: 6th proyecto raises LIMIT_EXCEEDED'
);
SELECT is(
  (SELECT count(*)::int FROM public.proyectos WHERE user_id = '88888888-8888-8888-8888-888888888801'),
  5, 'free user: proyectos count stays at 5 after the blocked insert'
);

-- Pro user: unaffected at 51 clientes ---------------------------------------
INSERT INTO auth.users (id, email) VALUES
  ('88888888-8888-8888-8888-888888888802', 'limit-pro@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'active'
 WHERE user_id = '88888888-8888-8888-8888-888888888802';

INSERT INTO public.clientes (user_id, name)
SELECT '88888888-8888-8888-8888-888888888802', 'C' || g
FROM generate_series(1, 50) g;

SELECT lives_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('88888888-8888-8888-8888-888888888802', 'C51') $$,
  'pro user: 51st cliente insert succeeds (unlimited plan)'
);
SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '88888888-8888-8888-8888-888888888802'),
  51, 'pro user: clientes count is 51'
);

-- Downgraded user: 10 existing clientes (over Free limit) -------------------
-- These rows are seeded while the user is still Pro (unlimited), matching how a
-- real downgrade happens: the rows predate the plan change, they are never
-- deleted, and only NEW inserts get blocked once the user is back on Free.
INSERT INTO auth.users (id, email) VALUES
  ('88888888-8888-8888-8888-888888888803', 'limit-downgraded@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'active'
 WHERE user_id = '88888888-8888-8888-8888-888888888803';

INSERT INTO public.clientes (user_id, name)
SELECT '88888888-8888-8888-8888-888888888803', 'C' || g
FROM generate_series(1, 10) g;

-- The downgrade itself: back to Free, with the 10 rows already in place.
UPDATE public.subscriptions
   SET plan_code = 'free', status = 'free'
 WHERE user_id = '88888888-8888-8888-8888-888888888803';

SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '88888888-8888-8888-8888-888888888803'),
  10, 'downgraded user: all 10 over-limit rows remain readable'
);
WITH upd AS (
  UPDATE public.clientes SET name = 'renamed'
   WHERE user_id = '88888888-8888-8888-8888-888888888803' AND name = 'C1'
  RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 1, 'downgraded user: updating an existing over-limit row succeeds');
WITH del AS (
  DELETE FROM public.clientes
   WHERE user_id = '88888888-8888-8888-8888-888888888803' AND name = 'C2'
  RETURNING 1
)
SELECT is((SELECT count(*)::int FROM del), 1, 'downgraded user: deleting an existing over-limit row succeeds');
SELECT throws_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('88888888-8888-8888-8888-888888888803', 'C-new') $$,
  'P0001', 'LIMIT_EXCEEDED',
  'downgraded user: new insert while still over limit raises LIMIT_EXCEEDED'
);

-- Missing subscription: defense-in-depth defaults to Free -------------------
INSERT INTO auth.users (id, email) VALUES
  ('88888888-8888-8888-8888-888888888804', 'limit-no-sub@clientflow.test');
DELETE FROM public.subscriptions WHERE user_id = '88888888-8888-8888-8888-888888888804';

INSERT INTO public.clientes (user_id, name)
SELECT '88888888-8888-8888-8888-888888888804', 'C' || g
FROM generate_series(1, 3) g;

SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE user_id = '88888888-8888-8888-8888-888888888804'),
  3, 'missing subscription: first 3 clientes insert as if Free (limit 3)'
);
SELECT throws_ok(
  $$ INSERT INTO public.clientes (user_id, name) VALUES ('88888888-8888-8888-8888-888888888804', 'C4') $$,
  'P0001', 'LIMIT_EXCEEDED',
  'missing subscription: 4th cliente still raises LIMIT_EXCEEDED (defaults to Free)'
);

SELECT * FROM finish();
ROLLBACK;
