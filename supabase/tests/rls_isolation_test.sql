-- RLS cross-user isolation regression suite (spec: data-isolation-rls).
-- Seeds two users (A, B) with one row each in every M0 table, then
-- authenticates as B and asserts B can read/write only their own rows.
-- Run with: supabase test db (spins up local Postgres via `supabase start`).

BEGIN;
SELECT plan(16);

-- Fixture users -------------------------------------------------------
INSERT INTO auth.users (id, email)
VALUES
  ('11111111-1111-1111-1111-111111111111', 'user-a@clientflow.test'),
  ('22222222-2222-2222-2222-222222222222', 'user-b@clientflow.test');

-- Fixture rows, one per table per user, seeded as postgres (bypasses RLS)
INSERT INTO public.clientes (id, user_id, name) VALUES
  ('aaaaaaaa-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Cliente A'),
  ('aaaaaaaa-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Cliente B');

INSERT INTO public.proyectos (id, user_id, name) VALUES
  ('bbbbbbbb-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Proyecto A'),
  ('bbbbbbbb-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Proyecto B');

INSERT INTO public.pagos (id, user_id, amount) VALUES
  ('cccccccc-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 100.00),
  ('cccccccc-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 200.00);

INSERT INTO public.tareas (id, user_id, title) VALUES
  ('dddddddd-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Tarea A'),
  ('dddddddd-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'Tarea B');

-- Authenticate as user B ------------------------------------------------
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '22222222-2222-2222-2222-222222222222', true);

-- clientes ---------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001'),
  0, 'clientes: user B cannot SELECT user A''s row'
);
WITH upd AS (
  UPDATE public.clientes SET name = 'hacked' WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'clientes: user B cannot UPDATE user A''s row');

WITH del AS (
  DELETE FROM public.clientes WHERE id = 'aaaaaaaa-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM del), 0, 'clientes: user B cannot DELETE user A''s row');
SELECT is(
  (SELECT count(*)::int FROM public.clientes WHERE id = 'aaaaaaaa-0000-0000-0000-000000000002'),
  1, 'clientes: user B can SELECT their own row'
);

-- proyectos ---------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.proyectos WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001'),
  0, 'proyectos: user B cannot SELECT user A''s row'
);
WITH upd AS (
  UPDATE public.proyectos SET name = 'hacked' WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'proyectos: user B cannot UPDATE user A''s row');

WITH del AS (
  DELETE FROM public.proyectos WHERE id = 'bbbbbbbb-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM del), 0, 'proyectos: user B cannot DELETE user A''s row');
SELECT is(
  (SELECT count(*)::int FROM public.proyectos WHERE id = 'bbbbbbbb-0000-0000-0000-000000000002'),
  1, 'proyectos: user B can SELECT their own row'
);

-- pagos ---------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.pagos WHERE id = 'cccccccc-0000-0000-0000-000000000001'),
  0, 'pagos: user B cannot SELECT user A''s row'
);
WITH upd AS (
  UPDATE public.pagos SET amount = 999 WHERE id = 'cccccccc-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'pagos: user B cannot UPDATE user A''s row');

WITH del AS (
  DELETE FROM public.pagos WHERE id = 'cccccccc-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM del), 0, 'pagos: user B cannot DELETE user A''s row');
SELECT is(
  (SELECT count(*)::int FROM public.pagos WHERE id = 'cccccccc-0000-0000-0000-000000000002'),
  1, 'pagos: user B can SELECT their own row'
);

-- tareas ---------------------------------------------------------------
SELECT is(
  (SELECT count(*)::int FROM public.tareas WHERE id = 'dddddddd-0000-0000-0000-000000000001'),
  0, 'tareas: user B cannot SELECT user A''s row'
);
WITH upd AS (
  UPDATE public.tareas SET title = 'hacked' WHERE id = 'dddddddd-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM upd), 0, 'tareas: user B cannot UPDATE user A''s row');

WITH del AS (
  DELETE FROM public.tareas WHERE id = 'dddddddd-0000-0000-0000-000000000001' RETURNING 1
)
SELECT is((SELECT count(*)::int FROM del), 0, 'tareas: user B cannot DELETE user A''s row');
SELECT is(
  (SELECT count(*)::int FROM public.tareas WHERE id = 'dddddddd-0000-0000-0000-000000000002'),
  1, 'tareas: user B can SELECT their own row'
);

RESET ROLE;
SELECT * FROM finish();
ROLLBACK;
