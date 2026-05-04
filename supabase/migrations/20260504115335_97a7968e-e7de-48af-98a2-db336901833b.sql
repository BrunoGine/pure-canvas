
CREATE OR REPLACE FUNCTION public.get_shared_goal_profiles(_user_ids uuid[])
RETURNS TABLE(id uuid, display_name text, avatar_url text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.id, p.display_name, p.avatar_url
  FROM public.profiles p
  WHERE p.id = ANY(_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.shared_goal_members m1
      JOIN public.shared_goal_members m2
        ON m1.shared_goal_id = m2.shared_goal_id
      WHERE m1.user_id = auth.uid()
        AND m2.user_id = p.id
    );
$$;
