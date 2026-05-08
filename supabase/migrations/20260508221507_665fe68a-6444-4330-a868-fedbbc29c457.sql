ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS monthly_income numeric,
  ADD COLUMN IF NOT EXISTS financial_goal text,
  ADD COLUMN IF NOT EXISTS tracks_expenses text,
  ADD COLUMN IF NOT EXISTS has_emergency_fund boolean,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;