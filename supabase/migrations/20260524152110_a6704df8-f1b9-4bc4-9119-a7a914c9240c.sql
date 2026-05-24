
-- subscription_overrides: manual/promotional access grants
CREATE TABLE public.subscription_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  plan_type subscription_plan NOT NULL,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NULL,
  granted_by uuid NOT NULL,
  reason text NOT NULL DEFAULT '',
  active boolean NOT NULL DEFAULT true,
  revoked_at timestamptz NULL,
  revoked_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_sub_overrides_user_active ON public.subscription_overrides(user_id, active);

ALTER TABLE public.subscription_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own overrides"
  ON public.subscription_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins insert overrides"
  ON public.subscription_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update overrides"
  ON public.subscription_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete overrides"
  ON public.subscription_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Get effective plan, considering overrides + stripe subscription
CREATE OR REPLACE FUNCTION public.get_effective_plan(_user_id uuid)
RETURNS subscription_plan
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_override_plan subscription_plan;
  v_sub_plan subscription_plan;
  v_sub_status subscription_status;
  v_trial_ends timestamptz;
BEGIN
  -- highest-tier active override
  SELECT plan_type INTO v_override_plan
  FROM public.subscription_overrides
  WHERE user_id = _user_id
    AND active = true
    AND starts_at <= now()
    AND (expires_at IS NULL OR expires_at > now())
  ORDER BY CASE plan_type WHEN 'enterprise' THEN 2 WHEN 'premium' THEN 1 ELSE 0 END DESC
  LIMIT 1;

  IF v_override_plan IS NOT NULL THEN
    RETURN v_override_plan;
  END IF;

  SELECT plan, status, trial_ends_at INTO v_sub_plan, v_sub_status, v_trial_ends
  FROM public.subscriptions WHERE user_id = _user_id LIMIT 1;

  IF v_sub_plan IS NULL THEN RETURN 'free'; END IF;
  IF v_sub_status = 'active' THEN RETURN v_sub_plan; END IF;
  IF v_sub_status = 'trialing' AND v_trial_ends IS NOT NULL AND v_trial_ends > now() THEN
    RETURN v_sub_plan;
  END IF;
  RETURN 'free';
END;
$$;

-- Grant override (admin only)
CREATE OR REPLACE FUNCTION public.admin_grant_override(
  _user_id uuid,
  _plan subscription_plan,
  _duration_days integer,
  _reason text
)
RETURNS subscription_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

  -- revoke any existing active overrides for same user
  UPDATE public.subscription_overrides
    SET active = false, revoked_at = now(), revoked_by = auth.uid()
    WHERE user_id = _user_id AND active = true;

  v_expires := CASE WHEN _duration_days IS NULL OR _duration_days <= 0
                    THEN NULL
                    ELSE now() + make_interval(days => _duration_days) END;

  INSERT INTO public.subscription_overrides
    (user_id, plan_type, expires_at, granted_by, reason)
  VALUES (_user_id, _plan, v_expires, auth.uid(), COALESCE(_reason,''))
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Revoke a specific override
CREATE OR REPLACE FUNCTION public.admin_revoke_override(_override_id uuid)
RETURNS subscription_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.subscription_overrides;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can revoke overrides';
  END IF;
  UPDATE public.subscription_overrides
    SET active = false, revoked_at = now(), revoked_by = auth.uid()
    WHERE id = _override_id
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- Admin search users by name/email
CREATE OR REPLACE FUNCTION public.admin_search_users(_query text)
RETURNS TABLE(id uuid, display_name text, email text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can search users';
  END IF;
  RETURN QUERY
    SELECT p.id, p.display_name, u.email::text
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    WHERE _query IS NULL OR _query = ''
       OR p.display_name ILIKE '%' || _query || '%'
       OR u.email ILIKE '%' || _query || '%'
    ORDER BY p.display_name NULLS LAST
    LIMIT 20;
END;
$$;
