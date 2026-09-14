SET local check_function_bodies = off;

CREATE TABLE "public"."clientes" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "name"       text                     NOT NULL,
  "email"      text,
  "celular"    text,
  "company"    text,
  "created_at" timestamp with time zone DEFAULT now(),
  CONSTRAINT "clientes_pkey" PRIMARY KEY (id)
);

ALTER TABLE "public"."clientes"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."pagos" (
  "id"           uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"      uuid                     NOT NULL,
  "project_id"   uuid,
  "amount"       numeric(10,2)            NOT NULL,
  "payment_date" date                     DEFAULT CURRENT_DATE,
  "method"       text                     DEFAULT 'efectivo'::text,
  "status"       text                     DEFAULT 'pendiente'::text,
  "notes"        text,
  "created_at"   timestamp with time zone DEFAULT now(),
  CONSTRAINT "pagos_method_check" CHECK ((method = ANY (ARRAY['efectivo'::text, 'transferencia'::text, 'tarjeta'::text, 'otro'::text]))),
  CONSTRAINT "pagos_pkey" PRIMARY KEY (id),
  CONSTRAINT "pagos_status_check" CHECK ((status = ANY (ARRAY['pendiente'::text, 'pagado'::text])))
);

ALTER TABLE "public"."pagos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."proyectos" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "client_id"   uuid,
  "name"        text                     NOT NULL,
  "description" text,
  "status"      text                     DEFAULT 'activo'::text,
  "budget"      numeric(10,2),
  "start_date"  date,
  "end_date"    date,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "proyectos_pkey" PRIMARY KEY (id),
  CONSTRAINT "proyectos_status_check" CHECK ((status = ANY (ARRAY['activo'::text, 'pausado'::text, 'completo'::text])))
);

ALTER TABLE "public"."proyectos"
  ENABLE ROW LEVEL SECURITY;

CREATE TABLE "public"."tareas" (
  "id"          uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"     uuid                     NOT NULL,
  "project_id"  uuid,
  "title"       text                     NOT NULL,
  "description" text,
  "status"      text                     DEFAULT 'pendiente'::text,
  "priority"    text                     DEFAULT 'medium'::text,
  "due_date"    date,
  "created_at"  timestamp with time zone DEFAULT now(),
  CONSTRAINT "tareas_pkey" PRIMARY KEY (id),
  CONSTRAINT "tareas_priority_check" CHECK ((priority = ANY (ARRAY['low'::text, 'medium'::text, 'high'::text]))),
  CONSTRAINT "tareas_status_check" CHECK ((status = ANY (ARRAY['pendiente'::text, 'en_progreso'::text, 'hechas'::text])))
);

ALTER TABLE "public"."tareas"
  ENABLE ROW LEVEL SECURITY;

CREATE TYPE "public"."client_status" AS ENUM (
  'pendiente',
  'activo',
  'inactivo'
);

ALTER TABLE "public"."clientes"
  ADD COLUMN "status" public.client_status DEFAULT 'pendiente'::public.client_status;

CREATE TYPE "public"."status" AS ENUM (
  'pendiente',
  'activo',
  'inactivo'
);

CREATE OR REPLACE FUNCTION public.rls_auto_enable()
  RETURNS event_trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'pg_catalog'
  AS $function$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$function$;

ALTER TABLE "public"."clientes"
  ADD CONSTRAINT "clientes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."pagos"
  ADD CONSTRAINT "pagos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."proyectos"
  ADD CONSTRAINT "proyectos_client_id_fkey" FOREIGN KEY (client_id) REFERENCES public.clientes(id);

ALTER TABLE "public"."pagos"
  ADD CONSTRAINT "pagos_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.proyectos(id);

ALTER TABLE "public"."proyectos"
  ADD CONSTRAINT "proyectos_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

ALTER TABLE "public"."tareas"
  ADD CONSTRAINT "tareas_project_id_fkey" FOREIGN KEY (project_id) REFERENCES public.proyectos(id) ON DELETE CASCADE;

ALTER TABLE "public"."tareas"
  ADD CONSTRAINT "tareas_user_id_fkey" FOREIGN KEY (user_id) REFERENCES auth.users(id);

CREATE POLICY "clientes_own" ON "public"."clientes"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "pagos_own" ON "public"."pagos"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "proyectos_own" ON "public"."proyectos"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE POLICY "tareas_own" ON "public"."tareas"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

CREATE EVENT TRIGGER "ensure_rls"
  ON ddl_command_end
  WHEN TAG IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
  EXECUTE FUNCTION "public"."rls_auto_enable"();

GRANT EXECUTE ON FUNCTION "public"."rls_auto_enable"() TO PUBLIC, "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."clientes" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."pagos" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."proyectos" TO "anon", "authenticated", "postgres", "service_role";

GRANT DELETE, INSERT, MAINTAIN, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE ON TABLE "public"."tareas" TO "anon", "authenticated", "postgres", "service_role";

GRANT USAGE ON TYPE "public"."client_status" TO "postgres";

GRANT USAGE ON TYPE "public"."status" TO "postgres";

