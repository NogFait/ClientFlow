-- Client notes (historial por cliente): dated free-text entries a freelancer
-- keeps per client ("le pasé presupuesto el 3, me dijo que lo ve con el
-- socio"). Same ownership model as the M0 tables: RLS on user_id, and rows
-- disappear with their client or their owner. Run with: supabase test db

BEGIN;
SELECT plan(9);

INSERT INTO auth.users (id, email) VALUES
  ('11111111-1111-1111-1111-111111111111', 'user-a@clientflow.test'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@clientflow.test');

INSERT INTO public.clientes (id, user_id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Cliente A'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Cliente B');

INSERT INTO public.notas (id, user_id, client_id, note_date, content) VALUES
  ('eeeeeeee-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', '2026-09-03', 'Pasé presupuesto'),
  ('eeeeeeee-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002', '2026-09-04', 'Nota de B');

-- Schema guarantees ----------------------------------------------------------
SELECT throws_ok(
  $$ INSERT INTO public.notas (user_id, client_id, content)
     VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', '   ') $$,
  '23514', NULL, 'a blank note is rejected (check constraint)'
);

SELECT is(
  (SELECT note_date FROM public.notas WHERE id = 'eeeeeeee-0000-0000-0000-000000000001'),
  '2026-09-03'::date, 'note_date is stored as a plain date'
);

-- RLS: user B sees and touches only their own notes ---------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

SELECT is((SELECT count(*)::int FROM public.notas WHERE id = 'eeeeeeee-0000-0000-0000-000000000001'), 0,
  'notas: user B cannot SELECT user A''s note');
SELECT is((SELECT count(*)::int FROM public.notas WHERE id = 'eeeeeeee-0000-0000-0000-000000000002'), 1,
  'notas: user B can SELECT their own note');

WITH del AS (DELETE FROM public.notas WHERE id = 'eeeeeeee-0000-0000-0000-000000000001' RETURNING 1)
SELECT is((SELECT count(*)::int FROM del), 0, 'notas: user B cannot DELETE user A''s note');

SELECT throws_ok(
  $$ INSERT INTO public.notas (user_id, client_id, content)
     VALUES ('11111111-1111-1111-1111-111111111111', 'aaaaaaaa-0000-0000-0000-000000000001', 'intruso') $$,
  '42501', NULL, 'notas: user B cannot INSERT a note owned by user A'
);

SELECT lives_ok(
  $$ INSERT INTO public.notas (user_id, client_id, content)
     VALUES ('22222222-2222-2222-2222-222222222222', 'aaaaaaaa-0000-0000-0000-000000000002', 'Segunda nota de B') $$,
  'notas: user B can INSERT a note on their own client'
);

RESET ROLE;

-- Cascades -------------------------------------------------------------------
DELETE FROM public.clientes WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002';
SELECT is((SELECT count(*)::int FROM public.notas WHERE client_id = 'aaaaaaaa-0000-0000-0000-000000000002'), 0,
  'deleting a client deletes its notes');

DELETE FROM auth.users WHERE id = '11111111-1111-1111-1111-111111111111';
SELECT is((SELECT count(*)::int FROM public.notas WHERE user_id = '11111111-1111-1111-1111-111111111111'), 0,
  'deleting a user deletes their notes');

SELECT * FROM finish();
ROLLBACK;
