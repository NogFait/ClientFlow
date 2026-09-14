-- get_entitlements() RPC regression suite (spec: plan-catalog-entitlements
-- "get_entitlements() single source of truth"; design §1 exact return shape).
-- Note (deviation, documented in apply-progress): the spec's example scenario text
-- ("status":"active", key "period_end") does not match the design's actual data
-- model (subscriptions.status defaults to the 'free' enum value for a Free-plan
-- user; the RPC returns "current_period_end", not "period_end", plus
-- "cancel_at_period_end" and "grace_until"). Implemented and tested against the
-- design's shape, which is internally consistent and matches the migrated schema.
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(11);

-- Fixture: Free user with 2 clientes / 1 proyecto -------------------------
INSERT INTO auth.users (id, email) VALUES
  ('66666666-6666-6666-6666-666666666666', 'entitlements-free@clientflow.test');
-- subscriptions row auto-provisioned by the signup trigger as plan_code='free'.

INSERT INTO public.clientes (user_id, name) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Cliente 1'),
  ('66666666-6666-6666-6666-666666666666', 'Cliente 2');
INSERT INTO public.proyectos (user_id, name) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Proyecto 1');

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666666', true);

SELECT is((SELECT public.get_entitlements() ->> 'plan'), 'free', 'free user: plan is free');
SELECT is((SELECT public.get_entitlements() ->> 'status'), 'free', 'free user: status is free');
SELECT is((SELECT public.get_entitlements() -> 'limits' ->> 'clientes'), '3', 'free user: clientes limit is 3');
SELECT is((SELECT public.get_entitlements() -> 'limits' ->> 'proyectos'), '5', 'free user: proyectos limit is 5');
SELECT is((SELECT public.get_entitlements() -> 'usage' ->> 'clientes'), '2', 'free user: usage.clientes reflects the 2 seeded rows');
SELECT is((SELECT public.get_entitlements() -> 'usage' ->> 'proyectos'), '1', 'free user: usage.proyectos reflects the 1 seeded row');
SELECT is((SELECT public.get_entitlements() ->> 'current_period_end'), NULL, 'free user: current_period_end is null');
SELECT is((SELECT public.get_entitlements() ->> 'cancel_at_period_end'), 'false', 'free user: cancel_at_period_end is false');
SELECT is((SELECT public.get_entitlements() ->> 'grace_until'), NULL, 'free user: grace_until is null');

RESET ROLE;

-- Triangulation: active Pro user with unlimited limits and zero usage -----
INSERT INTO auth.users (id, email) VALUES
  ('77777777-7777-7777-7777-777777777777', 'entitlements-pro@clientflow.test');
UPDATE public.subscriptions
   SET plan_code = 'pro_monthly', status = 'active'
 WHERE user_id = '77777777-7777-7777-7777-777777777777';

SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '77777777-7777-7777-7777-777777777777', true);

SELECT is((SELECT public.get_entitlements() ->> 'plan'), 'pro_monthly', 'pro user: plan is pro_monthly');
SELECT is((SELECT public.get_entitlements() -> 'limits' ->> 'clientes'), NULL, 'pro user: clientes limit is unlimited (null)');

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
