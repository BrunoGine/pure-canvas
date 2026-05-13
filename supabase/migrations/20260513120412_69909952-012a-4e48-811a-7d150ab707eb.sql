ALTER TABLE public.goals ALTER COLUMN target_amount DROP NOT NULL;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS monthly_target_amount numeric;
ALTER TABLE public.goals ADD COLUMN IF NOT EXISTS goal_type text NOT NULL DEFAULT 'target';
ALTER TABLE public.goals ADD CONSTRAINT goals_goal_type_check CHECK (goal_type IN ('target','monthly'));

CREATE OR REPLACE FUNCTION public.validate_goal()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NEW.current_amount IS NULL OR NEW.current_amount < 0 THEN
    NEW.current_amount := 0;
  END IF;

  IF NEW.goal_type = 'monthly' THEN
    IF NEW.monthly_target_amount IS NULL OR NEW.monthly_target_amount <= 0 THEN
      RAISE EXCEPTION 'monthly_target_amount deve ser maior que zero';
    END IF;
    -- metas mensais nunca são "concluídas" automaticamente
    NEW.is_completed := false;
    NEW.completed_at := NULL;
  ELSE
    IF NEW.target_amount IS NULL OR NEW.target_amount <= 0 THEN
      RAISE EXCEPTION 'target_amount deve ser maior que zero';
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
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;