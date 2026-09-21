-- Weekly digest (Pro): who receives it, and the opt-out toggle.
-- weekly_digest_recipients() is the server's source of truth — the plan
-- check happens here, not in the client. Run with: supabase test db

BEGIN;
SELECT plan(9);

INSERT INTO auth.users (id, email, email_confirmed_at) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'pro-active@clientflow.test',   now()),
  ('a0000000-0000-0000-0000-000000000002', 'free@clientflow.test',         now()),
  ('a0000000-0000-0000-0000-000000000003', 'pro-optout@clientflow.test',   now()),
  ('a0000000-0000-0000-0000-000000000004', 'pro-grace@clientflow.test',    now()),
  ('a0000000-0000-0000-0000-000000000005', 'pro-expired@clientflow.test',  now()),
  ('a0000000-0000-0000-0000-000000000006', 'pro-unconfirmed@clientflow.test', NULL);

-- signup provisioning trigger creates a free subscription row per user; move the Pro ones
UPDATE public.subscriptions SET plan_code = 'pro_monthly', status = 'active'
  WHERE user_id IN ('a0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000006');
UPDATE public.subscriptions SET plan_code = 'pro_monthly', status = 'past_due', grace_until = now() + interval '3 days'
  WHERE user_id = 'a0000000-0000-0000-0000-000000000004';
UPDATE public.subscriptions SET plan_code = 'pro_monthly', status = 'past_due', grace_until = now() - interval '1 day'
  WHERE user_id = 'a0000000-0000-0000-0000-000000000005';

INSERT INTO public.user_settings (user_id, weekly_digest)
  VALUES ('a0000000-0000-0000-0000-000000000003', false);

-- Recipients -----------------------------------------------------------------
SELECT results_eq(
  $$ SELECT email FROM public.weekly_digest_recipients() ORDER BY email $$,
  $$ VALUES ('pro-active@clientflow.test'), ('pro-grace@clientflow.test') $$,
  'recipients = effective Pro (active, or past_due inside grace) with the digest on and a confirmed email'
);

SELECT is((SELECT count(*)::int FROM public.weekly_digest_recipients() WHERE email = 'free@clientflow.test'), 0, 'free users are never recipients');
SELECT is((SELECT count(*)::int FROM public.weekly_digest_recipients() WHERE email = 'pro-optout@clientflow.test'), 0, 'weekly_digest = false opts out');
SELECT is((SELECT count(*)::int FROM public.weekly_digest_recipients() WHERE email = 'pro-expired@clientflow.test'), 0, 'past_due beyond grace is not Pro');
SELECT is((SELECT count(*)::int FROM public.weekly_digest_recipients() WHERE email = 'pro-unconfirmed@clientflow.test'), 0, 'unconfirmed emails are skipped');

-- Only the server may call it ------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', 'a0000000-0000-0000-0000-000000000001', true);
SELECT throws_ok(
  $$ SELECT * FROM public.weekly_digest_recipients() $$,
  '42501', NULL, 'authenticated users cannot list recipients'
);

-- user_settings RLS: own row only ----------------------------------------------
SELECT lives_ok(
  $$ INSERT INTO public.user_settings (user_id, weekly_digest) VALUES ('a0000000-0000-0000-0000-000000000001', false) $$,
  'a user can write their own settings row'
);
SELECT is((SELECT count(*)::int FROM public.user_settings WHERE user_id = 'a0000000-0000-0000-0000-000000000003'), 0,
  'a user cannot read another user''s settings');
SELECT throws_ok(
  $$ INSERT INTO public.user_settings (user_id, weekly_digest) VALUES ('a0000000-0000-0000-0000-000000000002', true) $$,
  '42501', NULL, 'a user cannot write another user''s settings'
);

SELECT * FROM finish();
ROLLBACK;
