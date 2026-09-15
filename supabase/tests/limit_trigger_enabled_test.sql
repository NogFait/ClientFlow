-- Plan limit triggers must be ENABLED in the deployed schema
-- (spec: plan-catalog-entitlements — Free blocks the 4th cliente / 6th proyecto).
--
-- 20260914183000_limit_trigger.sql shipped the triggers DISABLED on purpose
-- (deploy-order gate: UI + flag first). Once 20260914200000_enable_limit_triggers.sql
-- is applied, both triggers must be active ('O' = enabled, fires on origin).
-- limit_trigger_test.sql enables them inside its own transaction, so this file
-- is the only one that asserts the REAL deployed state.
BEGIN;
SELECT plan(2);

SELECT is(
  (SELECT tgenabled FROM pg_trigger
    WHERE tgname = 'check_plan_limit_clientes'
      AND tgrelid = 'public.clientes'::regclass),
  'O',
  'check_plan_limit_clientes trigger is enabled'
);

SELECT is(
  (SELECT tgenabled FROM pg_trigger
    WHERE tgname = 'check_plan_limit_proyectos'
      AND tgrelid = 'public.proyectos'::regclass),
  'O',
  'check_plan_limit_proyectos trigger is enabled'
);

SELECT * FROM finish();
ROLLBACK;
