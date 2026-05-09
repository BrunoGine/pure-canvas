
-- 1. Explicit UPDATE policy on user_stats (owner-only; mutations should go through award_xp/update_streak)
CREATE POLICY "Users update own stats"
ON public.user_stats
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 2. Block direct client INSERT on user_badges (must use award_user_badge SECURITY DEFINER fn)
CREATE POLICY "No direct badge inserts"
ON public.user_badges
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 3. Block direct client INSERT on certificates (must use issue_certificate SECURITY DEFINER fn)
CREATE POLICY "No direct certificate inserts"
ON public.certificates
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 4. Explicit deny INSERT on user_roles for non-admins (admin policy already exists via has_role)
CREATE POLICY "Only admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 5. Prevent score/completion manipulation on user_progress via trigger
CREATE OR REPLACE FUNCTION public.guard_user_progress_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Disallow lowering progress fields or arbitrary score inflation
  IF NEW.score IS DISTINCT FROM OLD.score AND NEW.score > COALESCE(OLD.score, 0) + 100 THEN
    RAISE EXCEPTION 'Score increase too large; use server function';
  END IF;
  IF OLD.completed = true AND NEW.completed = false THEN
    RAISE EXCEPTION 'Cannot un-complete a lesson';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS guard_user_progress_update_trg ON public.user_progress;
CREATE TRIGGER guard_user_progress_update_trg
BEFORE UPDATE ON public.user_progress
FOR EACH ROW
EXECUTE FUNCTION public.guard_user_progress_update();

-- 6. Revoke EXECUTE on internal trigger functions from anon/authenticated
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_stats() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.on_shared_goal_created() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC, anon, authenticated;
