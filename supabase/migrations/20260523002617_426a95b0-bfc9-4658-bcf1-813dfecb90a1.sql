CREATE TABLE public.device_credentials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  device_label text NOT NULL DEFAULT 'Dispositivo',
  credential_id text NOT NULL UNIQUE,
  public_key text NOT NULL,
  sign_count bigint NOT NULL DEFAULT 0,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_device_credentials_user ON public.device_credentials(user_id);

ALTER TABLE public.device_credentials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credentials"
  ON public.device_credentials FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users insert own credentials"
  ON public.device_credentials FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own credentials"
  ON public.device_credentials FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own credentials"
  ON public.device_credentials FOR DELETE
  TO authenticated USING (auth.uid() = user_id);