-- M1: billing schema — plan catalog, subscriptions, billing event log, RLS, plan seed.
-- Design: sdd/saas-conversion/design §1. Spec: plan-catalog-entitlements, data-isolation-rls R2.

CREATE TYPE "public"."subscription_status" AS ENUM (
  'free',
  'active',
  'past_due',
  'canceled'
);

CREATE TABLE "public"."plans" (
  "code"            text                     NOT NULL,
  "name"            text                     NOT NULL,
  "price_usd_cents" integer                  NOT NULL DEFAULT 0,
  "interval"        text,
  "limits"          jsonb                    NOT NULL,
  "is_active"       boolean                  NOT NULL DEFAULT true,
  "created_at"      timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "plans_pkey" PRIMARY KEY ("code"),
  CONSTRAINT "plans_interval_check" CHECK (("interval" = ANY (ARRAY['month'::text, 'year'::text])))
);

ALTER TABLE "public"."plans"
  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_read" ON "public"."plans"
  FOR SELECT
  TO "authenticated"
  USING (is_active);

-- NO INSERT/UPDATE/DELETE policy: catalog is written only by migrations / service_role.

INSERT INTO "public"."plans" ("code", "name", "price_usd_cents", "interval", "limits") VALUES
  ('free',        'Free',         0,     NULL,     '{"clientes":3,"proyectos":5}'::jsonb),
  ('pro_monthly', 'Pro mensual',  1200,  'month',  '{"clientes":null,"proyectos":null}'::jsonb),
  ('pro_yearly',  'Pro anual',    12000, 'year',   '{"clientes":null,"proyectos":null}'::jsonb);

CREATE TABLE "public"."subscriptions" (
  "user_id"                   uuid                     NOT NULL,
  "plan_code"                 text                     NOT NULL DEFAULT 'free',
  "status"                    public.subscription_status NOT NULL DEFAULT 'free'::public.subscription_status,
  "provider"                  text,
  "provider_customer_id"      text,
  "provider_subscription_id"  text,
  "current_period_end"        timestamp with time zone,
  "cancel_at_period_end"      boolean                  NOT NULL DEFAULT false,
  "grace_until"               timestamp with time zone,
  "created_at"                timestamp with time zone NOT NULL DEFAULT now(),
  "updated_at"                timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("user_id"),
  CONSTRAINT "subscriptions_provider_subscription_id_key" UNIQUE ("provider_subscription_id"),
  CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE,
  CONSTRAINT "subscriptions_plan_code_fkey" FOREIGN KEY ("plan_code") REFERENCES "public"."plans"("code")
);

ALTER TABLE "public"."subscriptions"
  ENABLE ROW LEVEL SECURITY;

CREATE INDEX "subscriptions_provider_customer_idx" ON "public"."subscriptions" ("provider", "provider_customer_id");

CREATE POLICY "subscriptions_read_own" ON "public"."subscriptions"
  FOR SELECT
  TO "authenticated"
  USING (auth.uid() = user_id);

-- NO INSERT/UPDATE/DELETE policy: subscriptions are written only by the signup trigger,
-- the webhook handler, and the limit trigger — all SECURITY DEFINER / service_role paths.

CREATE TABLE "public"."billing_events" (
  "id"                 bigint                   GENERATED ALWAYS AS IDENTITY,
  "provider"           text                     NOT NULL,
  "provider_event_id"  text                     NOT NULL,
  "type"               text                     NOT NULL,
  "payload"            jsonb                    NOT NULL,
  "received_at"        timestamp with time zone NOT NULL DEFAULT now(),
  "processed_at"       timestamp with time zone,
  "error"              text,
  CONSTRAINT "billing_events_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "billing_events_provider_event_id_key" UNIQUE ("provider", "provider_event_id")
);

ALTER TABLE "public"."billing_events"
  ENABLE ROW LEVEL SECURITY;

-- NO policies at all: fully inaccessible to anon/authenticated. Only service_role
-- (which bypasses RLS) writes/reads this table, from the webhook handler (M2).

-- Baseline sanity: clientes(user_id) / proyectos(user_id) already indexed via their
-- primary-key-adjacent FKs? No — baseline has no explicit index on user_id beyond the
-- FK itself. The limit trigger (migration 4) will benefit from one; adding here since
-- this migration is the natural home for "read path for the billing feature".
CREATE INDEX IF NOT EXISTS "clientes_user_id_idx" ON "public"."clientes" ("user_id");
CREATE INDEX IF NOT EXISTS "proyectos_user_id_idx" ON "public"."proyectos" ("user_id");
