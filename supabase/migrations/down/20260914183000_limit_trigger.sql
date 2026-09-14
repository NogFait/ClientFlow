-- DOWN migration (documentation only) for
-- supabase/migrations/20260914183000_limit_trigger.sql
--
-- This file is NOT auto-run by the Supabase CLI. It documents how to
-- manually reverse the (disabled-by-default) hard-limit trigger.
-- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/down/20260914183000_limit_trigger.sql`

BEGIN;

DROP TRIGGER IF EXISTS "check_plan_limit_proyectos" ON "public"."proyectos";
DROP TRIGGER IF EXISTS "check_plan_limit_clientes" ON "public"."clientes";
DROP FUNCTION IF EXISTS public.check_plan_limit();

COMMIT;
