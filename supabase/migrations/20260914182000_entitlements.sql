-- M1: entitlements — shared plan resolver + get_entitlements() RPC, the single
-- source of truth for both the limit trigger (migration 4) and the client.
-- Design: sdd/saas-conversion/design §1. Spec: plan-catalog-entitlements
-- "get_entitlements() single source of truth".

-- Shared resolver: collapses a subscription row + the 7-day past_due grace window
-- into the plan that is actually in effect right now. Time-based, no cron needed.
CREATE OR REPLACE FUNCTION public.effective_plan(p_user uuid)
  RETURNS TABLE(
    plan_code text,
    status public.subscription_status,
    limits jsonb,
    current_period_end timestamp with time zone,
    cancel_at_period_end boolean,
    grace_until timestamp with time zone
  )
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $function$
  SELECT
    CASE WHEN s.status = 'active' OR (s.status = 'past_due' AND now() < s.grace_until)
         THEN s.plan_code ELSE 'free' END,
    s.status,
    p.limits,
    s.current_period_end,
    s.cancel_at_period_end,
    s.grace_until
  FROM public.subscriptions s
  JOIN public.plans p
    ON p.code = CASE WHEN s.status = 'active' OR (s.status = 'past_due' AND now() < s.grace_until)
                      THEN s.plan_code ELSE 'free' END
  WHERE s.user_id = p_user
$function$;

-- Internal helper only: called from other SECURITY DEFINER functions (which run as
-- the function owner regardless of grants), never invoked directly by clients.
REVOKE EXECUTE ON FUNCTION public.effective_plan(uuid) FROM PUBLIC;

CREATE OR REPLACE FUNCTION public.get_entitlements()
  RETURNS jsonb
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $function$
  SELECT jsonb_build_object(
    'plan', e.plan_code,
    'status', e.status,
    'limits', e.limits,
    'usage', jsonb_build_object(
      'clientes', (SELECT count(*) FROM public.clientes WHERE user_id = auth.uid()),
      'proyectos', (SELECT count(*) FROM public.proyectos WHERE user_id = auth.uid())
    ),
    'current_period_end', e.current_period_end,
    'cancel_at_period_end', e.cancel_at_period_end,
    'grace_until', e.grace_until
  )
  FROM public.effective_plan(auth.uid()) e
$function$;

REVOKE EXECUTE ON FUNCTION public.get_entitlements() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_entitlements() TO authenticated;
