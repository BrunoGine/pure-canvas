-- Create credit_cards table
CREATE TABLE public.credit_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  bank TEXT NOT NULL DEFAULT 'outro',
  brand TEXT NOT NULL DEFAULT 'visa',
  closing_day INTEGER NOT NULL DEFAULT 1,
  color TEXT NOT NULL DEFAULT '#8A05BE',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own credit cards"
ON public.credit_cards FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own credit cards"
ON public.credit_cards FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own credit cards"
ON public.credit_cards FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own credit cards"
ON public.credit_cards FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add card_id to manual_transactions (nullable)
ALTER TABLE public.manual_transactions
ADD COLUMN card_id UUID NULL;

-- Trigger for updated_at on credit_cards
CREATE OR REPLACE FUNCTION public.update_credit_cards_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_credit_cards_updated_at
BEFORE UPDATE ON public.credit_cards
FOR EACH ROW
EXECUTE FUNCTION public.update_credit_cards_updated_at();