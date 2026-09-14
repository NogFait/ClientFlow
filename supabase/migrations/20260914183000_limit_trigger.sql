-- M1: hard limit enforcement — BEFORE INSERT trigger on clientes/proyectos.
-- Design: sdd/saas-conversion/design §1. Spec: plan-catalog-entitlements
-- "Hard limit enforced in Postgres".
--
-- DEPLOY-ORDER DEVIATION (orchestrator decision, see sdd/saas-conversion/apply-progress):
-- this migration creates the function and triggers but ships them DISABLED. The
-- design requires the trigger to go live only after VITE_BILLING_ENABLED and the
-- UpgradePrompt exist client-side (M2) — flipping it on before that would silently
-- block real users with no UI to explain why. A one-line ENABLE migration lands in
-- M2 (task 2.27). pgTAP tests re-ENABLE the trigger inside their own transaction
-- (which rolls back) so the real behavior is still fully exercised locally.
--
-- Keyed on NEW.user_id (not auth.uid()) so service-role/backend/test inserts are
-- checked identically to client inserts — this is deliberate, not an oversight.

CREATE OR REPLACE FUNCTION public.check_plan_limit()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
DECLARE
  v_limit int;
  v_count int;
  v_plan  text;
BEGIN
  SELECT (e.limits ->> TG_TABLE_NAME)::int, e.plan_code
    INTO v_limit, v_plan
  FROM public.effective_plan(new.user_id) e;

  -- Defense in depth: a user with no subscriptions row at all (should be
  -- impossible once the signup trigger exists) is treated as Free, not unlimited.
  IF v_plan IS NULL THEN
    v_plan := 'free';
    SELECT (p.limits ->> TG_TABLE_NAME)::int INTO v_limit
    FROM public.plans p WHERE p.code = 'free';
  END IF;

  IF v_limit IS NULL THEN
    RETURN new; -- unlimited plan
  END IF;

  EXECUTE format('SELECT count(*) FROM public.%I WHERE user_id = $1', TG_TABLE_NAME)
    INTO v_count
    USING new.user_id;

  IF v_count >= v_limit THEN
    RAISE EXCEPTION 'LIMIT_EXCEEDED' USING
      ERRCODE = 'P0001',
      DETAIL = json_build_object('resource', TG_TABLE_NAME, 'limit', v_limit, 'current', v_count, 'plan', v_plan)::text,
      HINT = 'upgrade';
  END IF;

  RETURN new;
END;
$function$;

CREATE TRIGGER "check_plan_limit_clientes"
  BEFORE INSERT ON "public"."clientes"
  FOR EACH ROW
  EXECUTE FUNCTION public.check_plan_limit();

CREATE TRIGGER "check_plan_limit_proyectos"
  BEFORE INSERT ON "public"."proyectos"
  FOR EACH ROW
  EXECUTE FUNCTION public.check_plan_limit();

ALTER TABLE "public"."clientes" DISABLE TRIGGER "check_plan_limit_clientes";
ALTER TABLE "public"."proyectos" DISABLE TRIGGER "check_plan_limit_proyectos";
