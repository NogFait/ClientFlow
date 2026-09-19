-- Rollback for 20260919200000_cascade_user_deletion.sql
-- Restores the original NO ACTION foreign keys (user deletion blocked again).

ALTER TABLE "public"."clientes"
  DROP CONSTRAINT "clientes_user_id_fkey",
  ADD CONSTRAINT "clientes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."proyectos"
  DROP CONSTRAINT "proyectos_user_id_fkey",
  ADD CONSTRAINT "proyectos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."pagos"
  DROP CONSTRAINT "pagos_user_id_fkey",
  ADD CONSTRAINT "pagos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."tareas"
  DROP CONSTRAINT "tareas_user_id_fkey",
  ADD CONSTRAINT "tareas_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);
