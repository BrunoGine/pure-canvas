-- Fix manual_transactions: restrict policies to authenticated role only
DROP POLICY IF EXISTS "Users can view own transactions" ON public.manual_transactions;
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.manual_transactions;
DROP POLICY IF EXISTS "Users can update own transactions" ON public.manual_transactions;
DROP POLICY IF EXISTS "Users can delete own transactions" ON public.manual_transactions;

CREATE POLICY "Users can view own transactions"
ON public.manual_transactions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions"
ON public.manual_transactions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions"
ON public.manual_transactions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions"
ON public.manual_transactions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add missing INSERT and DELETE policies on profiles
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
TO authenticated
USING (auth.uid() = id);