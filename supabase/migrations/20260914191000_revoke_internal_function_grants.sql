-- Revoke materialized EXECUTE grants on internal billing helpers.
--
-- 20260914182000_entitlements.sql only did "REVOKE ... FROM PUBLIC", which
-- does not remove the per-role grants that Supabase's default privileges
-- materialize on anon/authenticated/service_role at function creation time.
-- Without this, any authenticated user could call effective_plan(<other uuid>)
-- and anon could call get_entitlements().

REVOKE ALL ON FUNCTION public.effective_plan(uuid) FROM anon, authenticated;
REVOKE ALL ON FUNCTION public.get_entitlements() FROM anon;

-- get_entitlements() stays callable by authenticated (client RPC) and
-- service_role; effective_plan() is only reached through SECURITY DEFINER
-- callers (get_entitlements, check_plan_limit) and service_role.
