-- Function EXECUTE grants (spec: data-isolation-rls, defense in depth).
--
-- Supabase's default privileges grant EXECUTE on every new public function to
-- anon/authenticated/service_role at creation time. "REVOKE ... FROM PUBLIC"
-- alone does not remove those materialized per-role grants, so internal
-- helpers must be revoked explicitly. This suite pins the intended surface:
--   * effective_plan(uuid)  → internal only (no anon, no authenticated)
--   * get_entitlements()    → authenticated only (no anon)
BEGIN;
SELECT plan(4);

-- effective_plan: authenticated must NOT be able to probe other users' plans
SET LOCAL ROLE authenticated;
SELECT set_config('request.jwt.claim.sub', '66666666-6666-6666-6666-666666666601', true);
SELECT throws_ok(
  $$ SELECT public.effective_plan('66666666-6666-6666-6666-666666666602'::uuid) $$,
  '42501',
  NULL,
  'effective_plan: authenticated role has no EXECUTE grant'
);
RESET ROLE;

-- effective_plan: anon must not be able to call it either
SET LOCAL ROLE anon;
SELECT throws_ok(
  $$ SELECT public.effective_plan('66666666-6666-6666-6666-666666666602'::uuid) $$,
  '42501',
  NULL,
  'effective_plan: anon role has no EXECUTE grant'
);
RESET ROLE;

-- get_entitlements: anon must not be able to call it
SET LOCAL ROLE anon;
SELECT throws_ok(
  $$ SELECT public.get_entitlements() $$,
  '42501',
  NULL,
  'get_entitlements: anon role has no EXECUTE grant'
);
RESET ROLE;

-- get_entitlements: authenticated keeps EXECUTE (the client depends on it)
SELECT ok(
  has_function_privilege('authenticated', 'public.get_entitlements()', 'EXECUTE'),
  'get_entitlements: authenticated role keeps EXECUTE'
);

SELECT * FROM finish();
ROLLBACK;
