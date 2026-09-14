-- DOWN migration (documentation only) for
-- supabase/migrations/20260914190000_apply_subscription_change.sql
--
-- This file is NOT auto-run by the Supabase CLI. Reverses the
-- apply_subscription_change RPC used by the webhook handler.
-- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/down/20260914190000_apply_subscription_change.sql`

BEGIN;

DROP FUNCTION IF EXISTS public.apply_subscription_change(
  bigint, uuid, text, public.subscription_status, text, text, text,
  timestamp with time zone, boolean, timestamp with time zone, timestamp with time zone
);

COMMIT;
