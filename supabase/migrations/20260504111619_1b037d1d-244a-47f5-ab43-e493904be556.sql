-- Allow creator to view their shared goal even before membership row is created
DROP POLICY IF EXISTS "Members can view shared goals" ON public.shared_goals;

CREATE POLICY "Members or creator can view shared goals"
ON public.shared_goals
FOR SELECT
TO authenticated
USING (auth.uid() = created_by OR public.is_shared_goal_member(id, auth.uid()));