-- Rollback for 20260921180000_weekly_digest.sql
DROP FUNCTION IF EXISTS public.weekly_digest_recipients();
DROP TABLE IF EXISTS "public"."user_settings";
