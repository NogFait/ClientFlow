-- Rollback for 20260914200000_enable_limit_triggers.sql
-- Puts the plan limit triggers back to sleep without dropping them.
ALTER TABLE "public"."clientes"  DISABLE TRIGGER "check_plan_limit_clientes";
ALTER TABLE "public"."proyectos" DISABLE TRIGGER "check_plan_limit_proyectos";
