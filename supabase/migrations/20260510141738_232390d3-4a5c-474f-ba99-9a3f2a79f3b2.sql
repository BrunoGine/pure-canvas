
-- Companies table
CREATE TABLE public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  business_type text,
  segment text,
  monthly_revenue numeric,
  employees_count integer,
  main_goal text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own companies" ON public.companies FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own companies" ON public.companies FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own companies" ON public.companies FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own companies" ON public.companies FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TRIGGER update_companies_updated_at
BEFORE UPDATE ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.update_credit_cards_updated_at();

-- Add company_id to scoped tables
ALTER TABLE public.manual_transactions ADD COLUMN company_id uuid;
ALTER TABLE public.recurring_transactions ADD COLUMN company_id uuid;
ALTER TABLE public.budgets ADD COLUMN company_id uuid;
ALTER TABLE public.goals ADD COLUMN company_id uuid;
ALTER TABLE public.credit_cards ADD COLUMN company_id uuid;

CREATE INDEX idx_manual_tx_user_company ON public.manual_transactions(user_id, company_id);
CREATE INDEX idx_recurring_tx_user_company ON public.recurring_transactions(user_id, company_id);
CREATE INDEX idx_budgets_user_company ON public.budgets(user_id, company_id);
CREATE INDEX idx_goals_user_company ON public.goals(user_id, company_id);
CREATE INDEX idx_cards_user_company ON public.credit_cards(user_id, company_id);

-- Active company on profile
ALTER TABLE public.profiles ADD COLUMN active_company_id uuid;
