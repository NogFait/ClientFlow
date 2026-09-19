-- Deleting an auth user must take every row they own with it.
-- Regression: clientes/proyectos/pagos/tareas referenced auth.users(id)
-- without ON DELETE CASCADE, so the dashboard's "Delete user" (and any
-- future "delete my account") failed with a bare 500 for anyone who had
-- created a single client. Run with: supabase test db

BEGIN;
SELECT plan(6);

INSERT INTO auth.users (id, email)
VALUES ('99999999-9999-9999-9999-999999999999', 'leaving@clientflow.test');

INSERT INTO public.clientes (id, user_id, name)
VALUES ('aaaaaaaa-9999-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Cliente que se va');

INSERT INTO public.proyectos (id, user_id, client_id, name)
VALUES ('bbbbbbbb-9999-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999',
        'aaaaaaaa-9999-0000-0000-000000000001', 'Proyecto que se va');

INSERT INTO public.pagos (id, user_id, project_id, amount)
VALUES ('cccccccc-9999-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999',
        'bbbbbbbb-9999-0000-0000-000000000001', 100.00);

INSERT INTO public.tareas (id, user_id, project_id, title)
VALUES ('dddddddd-9999-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999',
        'bbbbbbbb-9999-0000-0000-000000000001', 'Tarea que se va');

SELECT lives_ok(
  $$ DELETE FROM auth.users WHERE id = '99999999-9999-9999-9999-999999999999' $$,
  'deleting a user who owns clients, projects, payments and tasks succeeds'
);

SELECT is((SELECT count(*)::int FROM auth.users WHERE id = '99999999-9999-9999-9999-999999999999'), 0, 'the auth user is gone');
SELECT is((SELECT count(*)::int FROM public.clientes  WHERE user_id = '99999999-9999-9999-9999-999999999999'), 0, 'their clientes are gone');
SELECT is((SELECT count(*)::int FROM public.proyectos WHERE user_id = '99999999-9999-9999-9999-999999999999'), 0, 'their proyectos are gone');
SELECT is((SELECT count(*)::int FROM public.pagos     WHERE user_id = '99999999-9999-9999-9999-999999999999'), 0, 'their pagos are gone');
SELECT is((SELECT count(*)::int FROM public.tareas    WHERE user_id = '99999999-9999-9999-9999-999999999999'), 0, 'their tareas are gone');

SELECT * FROM finish();
ROLLBACK;
