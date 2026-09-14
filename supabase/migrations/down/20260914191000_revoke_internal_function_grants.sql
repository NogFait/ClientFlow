-- Rollback for 20260914191000_revoke_internal_function_grants.sql
-- Restores the Supabase default per-role grants (not recommended; kept for symmetry).
GRANT EXECUTE ON FUNCTION public.effective_plan(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_entitlements() TO anon;
