ALTER TABLE public.conversations ADD COLUMN IF NOT EXISTS company_id uuid;
CREATE INDEX IF NOT EXISTS idx_conversations_user_company ON public.conversations(user_id, company_id);