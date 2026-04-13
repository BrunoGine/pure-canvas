
CREATE TABLE public.manual_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL DEFAULT 'Outros',
  date DATE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.manual_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.manual_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
  ON public.manual_transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
  ON public.manual_transactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
  ON public.manual_transactions FOR UPDATE
  USING (auth.uid() = user_id);
