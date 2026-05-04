
CREATE OR REPLACE FUNCTION public.approve_shared_contribution(_contribution_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contrib public.shared_goal_contributions%ROWTYPE;
  v_goal public.shared_goals%ROWTYPE;
  v_tx_id uuid;
  v_new_amount numeric;
BEGIN
  SELECT * INTO v_contrib FROM public.shared_goal_contributions WHERE id = _contribution_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contribution not found';
  END IF;

  IF v_contrib.status <> 'pending' THEN
    RAISE EXCEPTION 'Contribution already decided';
  END IF;

  IF NOT public.is_shared_goal_admin(v_contrib.shared_goal_id, auth.uid()) THEN
    RAISE EXCEPTION 'Only admins can approve contributions';
  END IF;

  SELECT * INTO v_goal FROM public.shared_goals WHERE id = v_contrib.shared_goal_id;

  -- Insert transaction for the contributor
  INSERT INTO public.manual_transactions (
    user_id, description, amount, type, category, date, payment_method, shared_goal_id
  ) VALUES (
    v_contrib.user_id,
    'Vaquinha: ' || v_goal.name,
    v_contrib.amount,
    'expense',
    'Meta compartilhada',
    CURRENT_DATE,
    'pix',
    v_goal.id
  ) RETURNING id INTO v_tx_id;

  v_new_amount := COALESCE(v_goal.current_amount, 0) + v_contrib.amount;

  UPDATE public.shared_goals
    SET current_amount = v_new_amount,
        is_completed = (v_new_amount >= target_amount),
        completed_at = CASE WHEN v_new_amount >= target_amount AND completed_at IS NULL THEN now() ELSE completed_at END
    WHERE id = v_goal.id;

  UPDATE public.shared_goal_members
    SET total_contributed = total_contributed + v_contrib.amount
    WHERE shared_goal_id = v_goal.id AND user_id = v_contrib.user_id;

  UPDATE public.shared_goal_contributions
    SET status = 'approved',
        decided_at = now(),
        decided_by = auth.uid(),
        transaction_id = v_tx_id
    WHERE id = _contribution_id;

  RETURN v_tx_id;
END;
$$;
