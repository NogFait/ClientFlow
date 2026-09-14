-- DOWN migration (documentation only) for
-- supabase/migrations/20260914181000_signup_provisioning.sql
--
-- This file is NOT auto-run by the Supabase CLI. It documents how to
-- manually reverse the signup-provisioning trigger. Note: this does NOT
-- delete the subscriptions rows created by the trigger or the backfill —
-- that data is a normal part of the billing schema, not migration-specific
-- side effects to undo.
-- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/down/20260914181000_signup_provisioning.sql`

BEGIN;

DROP TRIGGER IF EXISTS "on_auth_user_created_provision_subscription" ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_subscription();

COMMIT;
