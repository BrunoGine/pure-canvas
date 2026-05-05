
-- 1. shared_goal_members: remove self-insert. Only admins (or trigger) can insert.
DROP POLICY IF EXISTS "Self or admin can insert members" ON public.shared_goal_members;
CREATE POLICY "Admins can insert members"
  ON public.shared_goal_members
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_shared_goal_admin(shared_goal_id, auth.uid()));

-- 2. user_badges: remove direct insert; add validated SECURITY DEFINER function.
DROP POLICY IF EXISTS "Users insert own badges" ON public.user_badges;

CREATE OR REPLACE FUNCTION public.award_user_badge(_badge_key text)
RETURNS public.user_badges
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.user_badges;
  v_allowed text[] := ARRAY[
    'first_lesson','world_complete','streak_7','streak_30',
    'level_5','level_10','scholar','certified','daily_complete'
  ];
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF NOT (_badge_key = ANY(v_allowed)) THEN
    RAISE EXCEPTION 'Unknown badge: %', _badge_key;
  END IF;

  SELECT * INTO v_row FROM public.user_badges
   WHERE user_id = v_uid AND badge_key = _badge_key;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  INSERT INTO public.user_badges (user_id, badge_key)
  VALUES (v_uid, _badge_key)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 3. certificates: remove direct insert; add validated SECURITY DEFINER function.
DROP POLICY IF EXISTS "Users insert own certificates" ON public.certificates;

CREATE OR REPLACE FUNCTION public.issue_certificate(_course_id uuid)
RETURNS public.certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_row public.certificates;
  v_total int;
  v_done int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_row FROM public.certificates
   WHERE user_id = v_uid AND course_id = _course_id;
  IF FOUND THEN
    RETURN v_row;
  END IF;

  SELECT count(*) INTO v_total FROM public.lessons WHERE course_id = _course_id;
  IF v_total = 0 THEN
    RAISE EXCEPTION 'Course has no lessons';
  END IF;

  SELECT count(*) INTO v_done
  FROM public.lessons l
  JOIN public.user_progress p ON p.lesson_id = l.id
  WHERE l.course_id = _course_id
    AND p.user_id = v_uid
    AND p.completed = true;

  IF v_done < v_total THEN
    RAISE EXCEPTION 'Course not fully completed';
  END IF;

  INSERT INTO public.certificates (user_id, course_id)
  VALUES (v_uid, _course_id)
  RETURNING * INTO v_row;
  RETURN v_row;
END;
$$;

-- 4. user_stats: block direct updates by users.
DROP POLICY IF EXISTS "Users update own stats" ON public.user_stats;

-- 5. Fix mutable search_path on gen_invite_code.
CREATE OR REPLACE FUNCTION public.gen_invite_code()
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code text;
  i int;
  exists_count int;
BEGIN
  LOOP
    code := '';
    FOR i IN 1..8 LOOP
      code := code || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    SELECT count(*) INTO exists_count FROM public.shared_goals WHERE invite_code = code;
    EXIT WHEN exists_count = 0;
  END LOOP;
  RETURN code;
END;
$$;

-- 6. Restrict EXECUTE on SECURITY DEFINER functions to authenticated users only.
REVOKE EXECUTE ON FUNCTION public.award_xp(uuid, integer) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.update_streak(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.approve_shared_contribution(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_shared_goal_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_shared_goal_admin(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.find_shared_goal_by_code(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_shared_goal_profiles(uuid[]) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.award_user_badge(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.issue_certificate(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.award_xp(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_streak(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_shared_contribution(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shared_goal_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_shared_goal_admin(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.find_shared_goal_by_code(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_shared_goal_profiles(uuid[]) TO authenticated;
GRANT EXECUTE ON FUNCTION public.award_user_badge(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.issue_certificate(uuid) TO authenticated;
