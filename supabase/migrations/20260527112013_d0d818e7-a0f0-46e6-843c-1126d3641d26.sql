CREATE OR REPLACE FUNCTION public.admin_list_users(_search text DEFAULT NULL::text, _status text DEFAULT NULL::text, _plan text DEFAULT NULL::text, _inactive_days integer DEFAULT NULL::integer, _limit integer DEFAULT 25, _offset integer DEFAULT 0)
 RETURNS TABLE(id uuid, display_name text, email text, account_status account_status, status_reason text, effective_plan subscription_plan, subscription_status subscription_status, trial_ends_at timestamp with time zone, current_period_end timestamp with time zone, created_at timestamp with time zone, last_seen_at timestamp with time zone, login_count integer, transactions_count bigint, goals_count bigint, companies_count bigint, active_company_id uuid, total_count bigint)
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Only admins';
  END IF;

  RETURN QUERY
  WITH base AS (
    SELECT
      p.id AS b_id,
      p.display_name AS b_display_name,
      u.email::text AS b_email,
      p.account_status AS b_account_status,
      p.status_reason AS b_status_reason,
      public.get_effective_plan(p.id) AS b_effective_plan,
      s.status AS b_subscription_status,
      s.trial_ends_at AS b_trial_ends_at,
      s.current_period_end AS b_current_period_end,
      p.created_at AS b_created_at,
      p.last_seen_at AS b_last_seen_at,
      p.login_count AS b_login_count,
      (SELECT count(*) FROM public.manual_transactions t WHERE t.user_id = p.id) AS b_transactions_count,
      (SELECT count(*) FROM public.goals g WHERE g.user_id = p.id) AS b_goals_count,
      (SELECT count(*) FROM public.companies c WHERE c.user_id = p.id) AS b_companies_count,
      p.active_company_id AS b_active_company_id
    FROM public.profiles p
    LEFT JOIN auth.users u ON u.id = p.id
    LEFT JOIN public.subscriptions s ON s.user_id = p.id
  ),
  filtered AS (
    SELECT * FROM base
    WHERE (_search IS NULL OR _search = '' OR b_display_name ILIKE '%'||_search||'%' OR b_email ILIKE '%'||_search||'%')
      AND (_status IS NULL OR _status = '' OR b_account_status::text = _status)
      AND (_plan IS NULL OR _plan = '' OR b_effective_plan::text = _plan)
      AND (_inactive_days IS NULL OR b_last_seen_at IS NULL OR b_last_seen_at < now() - make_interval(days => _inactive_days))
  ),
  counted AS (
    SELECT *, count(*) OVER () AS c_total_count FROM filtered
  )
  SELECT
    c.b_id, c.b_display_name, c.b_email, c.b_account_status, c.b_status_reason,
    c.b_effective_plan, c.b_subscription_status, c.b_trial_ends_at, c.b_current_period_end,
    c.b_created_at, c.b_last_seen_at, c.b_login_count,
    c.b_transactions_count, c.b_goals_count, c.b_companies_count, c.b_active_company_id,
    c.c_total_count
  FROM counted c
  ORDER BY c.b_created_at DESC
  LIMIT GREATEST(_limit,1) OFFSET GREATEST(_offset,0);
END;
$function$;