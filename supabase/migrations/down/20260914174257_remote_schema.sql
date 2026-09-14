-- DOWN migration (documentation only) for
-- supabase/migrations/20260914174257_remote_schema.sql
--
-- This file is NOT auto-run by the Supabase CLI (there is no built-in
-- "down" runner). It documents how to manually reverse the M0 baseline
-- migration if the linked project ever needs to be rolled back to empty.
-- Apply with: `psql "$DATABASE_URL" -f supabase/migrations/down/20260914174257_remote_schema.sql`
-- after confirming no later migration depends on this schema.

BEGIN;

-- Event trigger + its function (created last in the up-migration, dropped first)
DROP EVENT TRIGGER IF EXISTS "ensure_rls";
DROP FUNCTION IF EXISTS "public"."rls_auto_enable"();

-- RLS policies
DROP POLICY IF EXISTS "clientes_own" ON "public"."clientes";
DROP POLICY IF EXISTS "pagos_own" ON "public"."pagos";
DROP POLICY IF EXISTS "proyectos_own" ON "public"."proyectos";
DROP POLICY IF EXISTS "tareas_own" ON "public"."tareas";

-- Foreign keys (drop before tables to keep this file reusable table-by-table)
ALTER TABLE IF EXISTS "public"."tareas" DROP CONSTRAINT IF EXISTS "tareas_user_id_fkey";
ALTER TABLE IF EXISTS "public"."tareas" DROP CONSTRAINT IF EXISTS "tareas_project_id_fkey";
ALTER TABLE IF EXISTS "public"."proyectos" DROP CONSTRAINT IF EXISTS "proyectos_user_id_fkey";
ALTER TABLE IF EXISTS "public"."pagos" DROP CONSTRAINT IF EXISTS "pagos_project_id_fkey";
ALTER TABLE IF EXISTS "public"."proyectos" DROP CONSTRAINT IF EXISTS "proyectos_client_id_fkey";
ALTER TABLE IF EXISTS "public"."pagos" DROP CONSTRAINT IF EXISTS "pagos_user_id_fkey";
ALTER TABLE IF EXISTS "public"."clientes" DROP CONSTRAINT IF EXISTS "clientes_user_id_fkey";

-- Tables (children before parents)
DROP TABLE IF EXISTS "public"."tareas";
DROP TABLE IF EXISTS "public"."pagos";
DROP TABLE IF EXISTS "public"."proyectos";
DROP TABLE IF EXISTS "public"."clientes";

-- Types added on top of the initial table creation
DROP TYPE IF EXISTS "public"."status";
DROP TYPE IF EXISTS "public"."client_status";

COMMIT;
