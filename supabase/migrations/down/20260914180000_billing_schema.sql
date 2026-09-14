-- DOWN migration (documentation only) for
-- supabase/migrations/20260914180000_billing_schema.sql
--
-- This file is NOT auto-run by the Supabase CLI (there is no built-in
-- "down" runner). It documents how to manually reverse the billing schema
-- migration if the linked project ever needs to be rolled back.
-- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/down/20260914180000_billing_schema.sql`
-- after confirming no later migration (signup_provisioning, entitlements,
-- limit_trigger) depends on this schema — those must be rolled back first.

BEGIN;

-- Indexes added on the pre-existing tables
DROP INDEX IF EXISTS "public"."proyectos_user_id_idx";
DROP INDEX IF EXISTS "public"."clientes_user_id_idx";

-- RLS policies
DROP POLICY IF EXISTS "subscriptions_read_own" ON "public"."subscriptions";
DROP POLICY IF EXISTS "plans_read" ON "public"."plans";

-- Tables (children before parents: subscriptions references plans)
DROP TABLE IF EXISTS "public"."billing_events";
DROP TABLE IF EXISTS "public"."subscriptions";
DROP TABLE IF EXISTS "public"."plans";

-- Types
DROP TYPE IF EXISTS "public"."subscription_status";

COMMIT;
