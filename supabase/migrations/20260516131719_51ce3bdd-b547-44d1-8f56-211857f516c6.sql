
-- Enums
CREATE TYPE public.subscription_plan AS ENUM ('free', 'premium', 'enterprise');
CREATE TYPE public.subscription_status AS ENUM ('active', 'trialing', 'expired', 'canceled', 'past_due');
CREATE TYPE public.billing_interval AS ENUM ('month', 'year');
CREATE TYPE public.payment_gateway AS ENUM ('stripe', 'mercadopago', 'none');

-- plans catalog
CREATE TABLE public.plans (
  key public.subscription_plan PRIMARY KEY,
  name text NOT NULL,
  tagline text,
  price_monthly_cents integer NOT NULL DEFAULT 0,
  price_yearly_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'BRL',
  features jsonb NOT NULL DEFAULT '[]'::jsonb,
  highlight boolean NOT NULL DEFAULT false,
  gateway_price_id_monthly text,
  gateway_price_id_yearly text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read plans"
  ON public.plans FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins manage plans"
  ON public.plans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- subscriptions: one per user
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  plan public.subscription_plan NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  trial_started_at timestamptz,
  trial_ends_at timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean NOT NULL DEFAULT false,
  billing_interval public.billing_interval,
  price_cents integer,
  currency text NOT NULL DEFAULT 'BRL',
  gateway public.payment_gateway NOT NULL DEFAULT 'none',
  gateway_customer_id text,
  gateway_subscription_id text,
  coupon_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own subscription"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all subscriptions"
  ON public.subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No client write policies: only edge functions (service role) write.

CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_subscriptions_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_subscriptions_updated_at
BEFORE UPDATE ON public.subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_subscriptions_updated_at();

CREATE TRIGGER trg_plans_updated_at
BEFORE UPDATE ON public.plans
FOR EACH ROW EXECUTE FUNCTION public.touch_subscriptions_updated_at();

-- Auto-create free subscription on new user (extend handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill: create free subscription for any existing user without one
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
LEFT JOIN public.subscriptions s ON s.user_id = p.id
WHERE s.id IS NULL;

-- Seed plans
INSERT INTO public.plans (key, name, tagline, price_monthly_cents, price_yearly_cents, features, highlight, sort_order) VALUES
('free', 'Gratuito',
  'Comece a organizar suas finanças sem pagar nada.',
  0, 0,
  '["Transações pessoais ilimitadas", "Categorias e orçamentos", "Metas pessoais", "Dashboards essenciais", "Harp.I.A. básica (limite diário)", "Suporte por chamado"]'::jsonb,
  false, 1),
('premium', 'Premium',
  'Acelere seu crescimento com educação financeira + IA avançada.',
  1490, 14300,
  '["Tudo do plano Gratuito", "Cursos completos com quizzes e certificados", "Harp.I.A. avançada sem limites diários", "Relatórios e insights aprofundados", "Análises mensais de tendências", "Badge premium no perfil"]'::jsonb,
  true, 2),
('enterprise', 'Empresa',
  'Gestão financeira profissional para o seu negócio.',
  3490, 33500,
  '["Tudo do plano Premium", "Módulo Minha Empresa completo", "Balanço Patrimonial em PDF", "Fluxo de caixa empresarial", "Metas e orçamentos empresariais", "Harp.I.A. empresarial com sugestões estratégicas", "Cursos empresariais (gestão, vendas, marketing)"]'::jsonb,
  false, 3);
