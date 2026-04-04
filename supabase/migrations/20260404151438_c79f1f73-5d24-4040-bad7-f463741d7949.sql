
CREATE UNIQUE INDEX idx_bank_connections_user_item ON public.bank_connections (user_id, pluggy_item_id);
CREATE UNIQUE INDEX idx_bank_accounts_user_account ON public.bank_accounts (user_id, pluggy_account_id);
