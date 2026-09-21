-- Historial por cliente: dated notes a freelancer keeps per client. Turns the
-- client list into a relationship log ("le pasé presupuesto el 3, quedé en
-- escribirle el 15") — today that lives in WhatsApp, which the landing
-- promises to replace. Free-plan feature, no plan limit.

CREATE TABLE "public"."notas" (
  "id"         uuid                     NOT NULL DEFAULT gen_random_uuid(),
  "user_id"    uuid                     NOT NULL,
  "client_id"  uuid                     NOT NULL,
  "note_date"  date                     NOT NULL DEFAULT CURRENT_DATE,
  "content"    text                     NOT NULL,
  "created_at" timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "notas_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "notas_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "notas_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "public"."clientes"("id") ON DELETE CASCADE,
  CONSTRAINT "notas_content_not_blank" CHECK (length(btrim("content")) > 0 AND length("content") <= 2000)
);

-- Listing is always "this client's notes, newest first".
CREATE INDEX "notas_client_id_note_date_idx" ON "public"."notas" ("client_id", "note_date" DESC, "created_at" DESC);

ALTER TABLE "public"."notas" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notas_own" ON "public"."notas"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

-- No grant to anon: notes are never public. service_role bypasses RLS but
-- still needs table privileges (admin/webhook paths).
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."notas" TO "authenticated", "service_role";
