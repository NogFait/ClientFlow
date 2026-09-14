-- DOWN migration (documentation only) for
-- supabase/migrations/20260914182000_entitlements.sql
--
-- This file is NOT auto-run by the Supabase CLI. It documents how to
-- manually reverse the entitlements RPC + resolver. Roll back the
-- limit_trigger migration first — check_plan_limit() calls effective_plan().
-- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/down/20260914182000_entitlements.sql`

BEGIN;

DROP FUNCTION IF EXISTS public.get_entitlements();
DROP FUNCTION IF EXISTS public.effective_plan(uuid);

COMMIT;
