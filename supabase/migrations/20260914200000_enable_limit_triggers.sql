-- Enable the plan limit triggers (M2 task 2.27 — final deploy-order gate).
--
-- 20260914183000_limit_trigger.sql created check_plan_limit() and its BEFORE
-- INSERT triggers DISABLED so that billing UI (UpgradePrompt, /settings/billing)
-- and VITE_BILLING_ENABLED could ship first. Both are live in production and the
-- end-to-end Polar sandbox flow has been verified, so limits go live now:
-- Free users are blocked at the 4th cliente / 6th proyecto with LIMIT_EXCEEDED.

ALTER TABLE "public"."clientes"  ENABLE TRIGGER "check_plan_limit_clientes";
ALTER TABLE "public"."proyectos" ENABLE TRIGGER "check_plan_limit_proyectos";
