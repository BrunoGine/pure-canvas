
-- 1. Enum + columns on profiles
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM ('active','suspended','banned','deleted');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_changed_by uuid,
  ADD COLUMN IF NOT EXISTS last_seen_at timestamptz,
  ADD COLUMN IF NOT EXISTS login_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_profiles_account_status ON public.profiles(account_status);
CREATE INDEX IF NOT EXISTS idx_profiles_last_seen ON public.profiles(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_profiles_created_at ON public.profiles(created_at);
CREATE INDEX IF NOT EXISTS idx_manual_tx_user ON public.manual_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON public.goals(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_user ON public.companies(user_id);

-- 2. admin_logs
CREATE TABLE IF NOT EXISTS public.admin_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_user_id);

ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read admin_logs" ON public.admin_logs;
CREATE POLICY "Admins read admin_logs" ON public.admin_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "No direct admin_logs writes" ON public.admin_logs;
CREATE POLICY "No direct admin_logs writes" ON public.admin_logs
  FOR INSERT TO authenticated WITH CHECK (false);

-- 3. handle_new_user already inserts profile; default covers account_status.

-- 4. touch_last_seen
CREATE OR REPLACE FUNCTION public.touch_last_seen()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN RETURN; END IF;
  UPDATE public.profiles
    SET last_seen_at = now(),
        login_count = login_count + 1
    WHERE id = auth.uid();
END;
$$;

-- 5. current_account_status
CREATE OR REPLACE FUNCTION public.current_account_status()
RETURNS public.account_status
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT account_status FROM public.profiles WHERE id = auth.uid()), 'active'::public.account_status);
$$;

-- 6. is_account_active helper
CREATE OR REPLACE FUNCTION public.is_account_active(_uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT account_status = 'active' FROM public.profiles WHERE id = _uid), true);
$$;

-- 7. admin_list_users
CREATE OR REPLACE FUNCTION public.admin_list_users(
  _search text DEFAULT NULL,
  _status text DEFAULT NULL,
  _plan text DEFAULT NULL,
  _inactive_days integer DEFAULT NULL,
  _limit integer DEFAULT 25,
  _offset integer DEFAULT 0
)
RETURNS TABLE(
  id uuid,
  display_name text,
  email text,
  account_status public.account_status,
  status_reason text,
  effective_plan public.subscription_plan,
  subscription_status public.subscription_status,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  created_at timestamptz,
  last_seen_at timestamptz,
  login_count integer,
  transactions_count bigint,
  goals_count bigint,
  companies_count bigint,
  active_company_id uuid,
  total_count bigint
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id,
      p.display_name,
      u.email::text AS email,
      p.account_status,
      p.status_reason,
      public.get_effective_plan(p.id) AS effective_plan,
      s.status AS subscription_status,
      s.trial_ends_at,
      s.current_period_end,
      p.created_at,
      p.last_seen_at,
      p.login_count,
      (SELECT count(*) FROM public.manual_transactions t WHERE t.user_id = p.id) AS transactions_count,
      (SELECT count(*) FROM public.goals g WHERE g.user_id = p.id) AS goals_count,
      (SELECT count(*) FROM public.companies c WHERE c.user_id = p.id) AS companies_count,
      p.active_company_id
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.subscriptions s ON s.user_id = p.id
  ),
  filtered AS (
    SELECT * FROM base
    WHERE (_search IS NULL OR _search = '' OR display_name ILIKE '%'||_search||'%' OR email ILIKE '%'||_search||'%')
      AND (_status IS NULL OR _status = '' OR account_status::text = _status)
      AND (_plan IS NULL OR _plan = '' OR effective_plan::text = _plan)
      AND (_inactive_days IS NULL OR last_seen_at IS NULL OR last_seen_at < now() - make_interval(days => _inactive_days))
  ),
  counted AS (
    SELECT *, count(*) OVER () AS total_count FROM filtered
  )
  SELECT
    c.id, c.display_name, c.email, c.account_status, c.status_reason,
    c.effective_plan, c.subscription_status, c.trial_ends_at, c.current_period_end,
    c.created_at, c.last_seen_at, c.login_count,
    c.transactions_count, c.goals_count, c.companies_count, c.active_company_id,
    c.total_count
  FROM counted c
  ORDER BY c.created_at DESC
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END;
$$;

-- 8. admin_get_user_detail
CREATE OR REPLACE FUNCTION public.admin_get_user_detail(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins';
  END IF;

  SELECT jsonb_build_object(
    'profile', to_jsonb(p) || jsonb_build_object('email', u.email::text),
    'effective_plan', public.get_effective_plan(p.id),
    'subscription', to_jsonb(s),
    'active_override', to_jsonb((
      SELECT o FROM public.subscription_overrides o
      WHERE o.user_id = p.id AND o.active = true
      ORDER BY o.created_at DESC LIMIT 1
    )),
    'override_history', COALESCE((
      SELECT jsonb_agg(to_jsonb(oh) ORDER BY oh.created_at DESC)
      FROM public.subscription_overrides oh
      WHERE oh.user_id = p.id
    ), '[]'::jsonb),
    'counts', jsonb_build_object(
      'transactions', (SELECT count(*) FROM public.manual_transactions WHERE user_id = p.id),
      'goals', (SELECT count(*) FROM public.goals WHERE user_id = p.id),
      'companies', (SELECT count(*) FROM public.companies WHERE user_id = p.id),
      'certificates', (SELECT count(*) FROM public.certificates WHERE user_id = p.id),
      'badges', (SELECT count(*) FROM public.user_badges WHERE user_id = p.id),
      'tickets', (SELECT count(*) FROM public.support_tickets WHERE user_id = p.id)
    ),
    'admin_logs', COALESCE((
      SELECT jsonb_agg(to_jsonb(al) ORDER BY al.created_at DESC)
      FROM (
        SELECT * FROM public.admin_logs WHERE target_user_id = p.id
        ORDER BY created_at DESC LIMIT 20
      ) al
    ), '[]'::jsonb)
  ) INTO result
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE p.id = _user_id;

  RETURN result;
END;
$$;

-- 9. admin_set_account_status
CREATE OR REPLACE FUNCTION public.admin_set_account_status(
  _user_id uuid,
  _status text,
  _reason text DEFAULT NULL
)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.profiles;
  v_status public.account_status;
  v_action text;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  IF _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Cannot change your own account status';
  END IF;
  v_status := _status::public.account_status;

  UPDATE public.profiles
    SET account_status = v_status,
        status_reason = _reason,
        status_changed_at = now(),
        status_changed_by = auth.uid(),
        deleted_at = CASE WHEN v_status = 'deleted' THEN now() ELSE NULL END
    WHERE id = _user_id
  RETURNING * INTO v_row;

  v_action := CASE v_status
    WHEN 'active' THEN 'restore_user'
    WHEN 'suspended' THEN 'suspend_user'
    WHEN 'banned' THEN 'ban_user'
    WHEN 'deleted' THEN 'soft_delete_user'
  END;

  INSERT INTO public.admin_logs(admin_id, action, target_user_id, metadata)
  VALUES (auth.uid(), v_action, _user_id, jsonb_build_object('reason', _reason, 'status', v_status));

  RETURN v_row;
END;
$$;

-- 10. admin_log_action helper (called by edge function via RPC after hard delete)
CREATE OR REPLACE FUNCTION public.admin_log_action(_action text, _target_user_id uuid, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  INSERT INTO public.admin_logs(admin_id, action, target_user_id, metadata)
  VALUES (auth.uid(), _action, _target_user_id, COALESCE(_metadata,'{}'::jsonb));
END;
$$;

-- 11. admin_metrics
CREATE OR REPLACE FUNCTION public.admin_metrics()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins';
  END IF;
  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.profiles WHERE account_status <> 'deleted'),
    'active_today', (SELECT count(*) FROM public.profiles WHERE last_seen_at > now() - interval '24 hours'),
    'new_7d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '7 days'),
    'new_30d', (SELECT count(*) FROM public.profiles WHERE created_at > now() - interval '30 days'),
    'premium', (SELECT count(*) FROM public.profiles p WHERE public.get_effective_plan(p.id) = 'premium'),
    'enterprise', (SELECT count(*) FROM public.profiles p WHERE public.get_effective_plan(p.id) = 'enterprise'),
    'trialing', (SELECT count(*) FROM public.subscriptions WHERE status = 'trialing' AND trial_ends_at > now()),
    'companies', (SELECT count(*) FROM public.companies),
    'inactive_30d', (SELECT count(*) FROM public.profiles WHERE COALESCE(last_seen_at, created_at) < now() - interval '30 days' AND account_status = 'active'),
    'suspended', (SELECT count(*) FROM public.profiles WHERE account_status = 'suspended'),
    'banned', (SELECT count(*) FROM public.profiles WHERE account_status = 'banned'),
    'soft_deleted', (SELECT count(*) FROM public.profiles WHERE account_status = 'deleted')
  ) INTO result;
  RETURN result;
END;
$$;

-- 12. Rewrite admin_grant_override / admin_revoke_override to also log
CREATE OR REPLACE FUNCTION public.admin_grant_override(_user_id uuid, _plan subscription_plan, _duration_days integer, _reason text)
RETURNS public.subscription_overrides
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_row public.subscription_overrides;
  v_expires timestamptz;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can grant overrides';
  END IF;
  IF _plan NOT IN ('premium','enterprise') THEN
    RAISE EXCEPTION 'Invalid plan';
  END IF;

  UPDATE public.subscription_overrides
    SET active = false, revoked_at = now(), revoked_by = auth.uid()
    WHERE user_id = _user_id AND active = true;

  v_expires := CASE WHEN _duration_days IS NULL OR _duration_days <= 0
                    THEN NULL ELSE now() + make_interval(days => _duration_days) END;

  INSERT INTO public.subscription_overrides
    (user_id, plan_type, expires_at, granted_by, reason)
  VALUES (_user_id, _plan, v_expires, auth.uid(), COALESCE(_reason,''))
  RETURNING * INTO v_row;

  INSERT INTO public.admin_logs(admin_id, action, target_user_id, metadata)
  VALUES (auth.uid(), 'grant_override', _user_id, jsonb_build_object(
    'plan', _plan, 'duration_days', _duration_days, 'reason', _reason, 'expires_at', v_expires
  ));

  RETURN v_row;
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_revoke_override(_override_id uuid)
RETURNS public.subscription_overrides
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE v_row public.subscription_overrides;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can revoke overrides';
  END IF;
  UPDATE public.subscription_overrides
    SET active = false, revoked_at = now(), revoked_by = auth.uid()
    WHERE id = _override_id
  RETURNING * INTO v_row;

  INSERT INTO public.admin_logs(admin_id, action, target_user_id, metadata)
  VALUES (auth.uid(), 'revoke_override', v_row.user_id, jsonb_build_object('override_id', _override_id));

  RETURN v_row;
END;
$$;
