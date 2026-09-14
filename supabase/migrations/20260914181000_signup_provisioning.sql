-- M1: signup provisioning — new users get a Free subscription automatically;
-- existing users (pre-dating this migration) are backfilled once.
-- Design: sdd/saas-conversion/design §1. Spec: auth delta "Signup provisions a Free
-- subscription"; subscription-lifecycle "Every user has a subscription row from creation".

CREATE OR REPLACE FUNCTION public.handle_new_user_subscription()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $function$
BEGIN
  INSERT INTO public.subscriptions (user_id, plan_code)
  VALUES (new.id, 'free')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN new;
END;
$function$;

CREATE TRIGGER "on_auth_user_created_provision_subscription"
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_subscription();

-- One-time backfill: any auth.users row that predates this migration gets a Free
-- subscription too, so the "no user exists without a subscription" invariant holds
-- retroactively as well as going forward.
INSERT INTO public.subscriptions (user_id, plan_code)
SELECT id, 'free' FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
