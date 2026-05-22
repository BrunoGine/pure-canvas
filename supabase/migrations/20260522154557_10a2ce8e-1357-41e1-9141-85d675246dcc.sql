
CREATE OR REPLACE FUNCTION public.get_shared_goal_profiles_v2(_user_ids uuid[])
RETURNS TABLE(
  id uuid,
  display_name text,
  avatar_url text,
  hide_avatar boolean,
  hide_profile boolean,
  hide_contribution boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT
    p.id,
    CASE WHEN COALESCE(ps.hide_profile_in_public_lists, false) THEN 'Membro' ELSE p.display_name END AS display_name,
    CASE WHEN COALESCE(ps.hide_avatar_in_shared_goals, false) OR COALESCE(ps.hide_profile_in_public_lists, false) THEN NULL ELSE p.avatar_url END AS avatar_url,
    COALESCE(ps.hide_avatar_in_shared_goals, false) AS hide_avatar,
    COALESCE(ps.hide_profile_in_public_lists, false) AS hide_profile,
    COALESCE(ps.hide_contribution_amount, false) AS hide_contribution
  FROM public.profiles p
  LEFT JOIN public.privacy_settings ps ON ps.user_id = p.id
  WHERE p.id = ANY(_user_ids)
    AND EXISTS (
      SELECT 1
      FROM public.shared_goal_members m1
      JOIN public.shared_goal_members m2 ON m1.shared_goal_id = m2.shared_goal_id
      WHERE m1.user_id = auth.uid() AND m2.user_id = p.id
    );
$$;
