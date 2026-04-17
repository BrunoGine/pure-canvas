ALTER TABLE public.manual_transactions
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pix';

ALTER TABLE public.recurring_transactions
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'pix';