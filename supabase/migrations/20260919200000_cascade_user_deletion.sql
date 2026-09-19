-- Deleting an auth user must delete everything they own.
-- The M0 tables referenced auth.users(id) with the default NO ACTION, so
-- any user with a single client could not be removed (dashboard "Delete
-- user" → 500, and no way to honour a "delete my account" request).
-- subscriptions already cascades (billing_schema); tareas→proyectos too.

ALTER TABLE "public"."clientes"
  DROP CONSTRAINT "clientes_user_id_fkey",
  ADD CONSTRAINT "clientes_user_id_fkey"
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."proyectos"
  DROP CONSTRAINT "proyectos_user_id_fkey",
  ADD CONSTRAINT "proyectos_user_id_fkey"
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."pagos"
  DROP CONSTRAINT "pagos_user_id_fkey",
  ADD CONSTRAINT "pagos_user_id_fkey"
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE "public"."tareas"
  DROP CONSTRAINT "tareas_user_id_fkey",
  ADD CONSTRAINT "tareas_user_id_fkey"
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
