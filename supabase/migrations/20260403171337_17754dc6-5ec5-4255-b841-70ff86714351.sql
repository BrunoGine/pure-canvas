
-- Bank connections table
CREATE TABLE public.bank_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pluggy_item_id TEXT NOT NULL,
  institution_name TEXT,
  status TEXT NOT NULL DEFAULT 'connected',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bank accounts table
CREATE TABLE public.bank_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  pluggy_account_id TEXT NOT NULL,
  name TEXT NOT NULL,
  balance NUMERIC NOT NULL DEFAULT 0,
  account_type TEXT NOT NULL DEFAULT 'CHECKING',
  currency TEXT NOT NULL DEFAULT 'BRL',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Bank transactions table
CREATE TABLE public.bank_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connection_id UUID NOT NULL REFERENCES public.bank_connections(id) ON DELETE CASCADE,
  account_id UUID REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  pluggy_transaction_id TEXT,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date DATE NOT NULL,
  category TEXT,
  type TEXT NOT NULL DEFAULT 'expense',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- RLS policies for bank_connections
ALTER TABLE public.bank_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank connections"
  ON public.bank_connections FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank connections"
  ON public.bank_connections FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank connections"
  ON public.bank_connections FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank connections"
  ON public.bank_connections FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for bank_accounts
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank accounts"
  ON public.bank_accounts FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank accounts"
  ON public.bank_accounts FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank accounts"
  ON public.bank_accounts FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank accounts"
  ON public.bank_accounts FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

-- RLS policies for bank_transactions
ALTER TABLE public.bank_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bank transactions"
  ON public.bank_transactions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bank transactions"
  ON public.bank_transactions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bank transactions"
  ON public.bank_transactions FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own bank transactions"
  ON public.bank_transactions FOR DELETE TO authenticated
  USING (auth.uid() = user_id);
