-- Tabela de metas
CREATE TABLE public.goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  target_amount numeric NOT NULL,
  current_amount numeric NOT NULL DEFAULT 0,
  deadline date,
  image_url text,
  is_completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.goals
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.goals
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.goals
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.goals
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Trigger de validação e auto-conclusão
CREATE OR REPLACE FUNCTION public.validate_goal()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.target_amount IS NULL OR NEW.target_amount <= 0 THEN
    RAISE EXCEPTION 'target_amount deve ser maior que zero';
  END IF;
  IF NEW.current_amount IS NULL OR NEW.current_amount < 0 THEN
    NEW.current_amount := 0;
  END IF;
  IF NEW.current_amount >= NEW.target_amount THEN
    NEW.is_completed := true;
    IF NEW.completed_at IS NULL THEN
      NEW.completed_at := now();
    END IF;
  ELSE
    NEW.is_completed := false;
    NEW.completed_at := NULL;
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER goals_validate
BEFORE INSERT OR UPDATE ON public.goals
FOR EACH ROW EXECUTE FUNCTION public.validate_goal();

CREATE INDEX idx_goals_user_id ON public.goals(user_id);

-- Vínculo de transações com metas
ALTER TABLE public.manual_transactions ADD COLUMN goal_id uuid;
ALTER TABLE public.recurring_transactions ADD COLUMN goal_id uuid;

CREATE INDEX idx_manual_tx_goal_id ON public.manual_transactions(goal_id);
CREATE INDEX idx_recurring_tx_goal_id ON public.recurring_transactions(goal_id);