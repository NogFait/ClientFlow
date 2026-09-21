-- Weekly digest (Pro): "Esta semana: pagos por vencer, vencidos, tareas y
-- clientes sin contacto". Sent by a Vercel cron (api/cron/weekly-digest)
-- through Resend. This migration adds the opt-out and the recipient list.

CREATE TABLE "public"."user_settings" (
  "user_id"       uuid                     NOT NULL,
  "weekly_digest" boolean                  NOT NULL DEFAULT true,
  "updated_at"    timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "user_settings_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "user_settings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE
);

ALTER TABLE "public"."user_settings" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_settings_own" ON "public"."user_settings"
  FOR ALL
  TO "authenticated"
  USING ((auth.uid() = user_id))
  WITH CHECK ((auth.uid() = user_id));

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE "public"."user_settings" TO "authenticated", "service_role";

-- Who gets this week's email. The plan check lives HERE (same rule as
-- effective_plan: active, or past_due still inside the grace window), so
-- the cron never decides entitlements on its own. No row in user_settings
-- means the default (on). Unconfirmed addresses are skipped.
CREATE OR REPLACE FUNCTION public.weekly_digest_recipients()
  RETURNS TABLE(user_id uuid, email text)
  LANGUAGE sql
  STABLE
  SECURITY DEFINER
  SET search_path = ''
AS $function$
  SELECT s.user_id, u.email::text
  FROM public.subscriptions s
  JOIN auth.users u ON u.id = s.user_id
  LEFT JOIN public.user_settings us ON us.user_id = s.user_id
  WHERE s.plan_code <> 'free'
    AND (s.status = 'active' OR (s.status = 'past_due' AND now() < s.grace_until))
    AND COALESCE(us.weekly_digest, true)
    AND u.email_confirmed_at IS NOT NULL
    AND u.email IS NOT NULL
$function$;

REVOKE EXECUTE ON FUNCTION public.weekly_digest_recipients() FROM PUBLIC, "anon", "authenticated";
GRANT EXECUTE ON FUNCTION public.weekly_digest_recipients() TO "service_role";
