
-- 1. legal_documents
CREATE TABLE public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('terms','privacy')),
  version text NOT NULL,
  content_md text NOT NULL,
  is_current boolean NOT NULL DEFAULT false,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kind, version)
);
CREATE UNIQUE INDEX legal_documents_one_current_per_kind
  ON public.legal_documents (kind) WHERE is_current;

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone authenticated can read legal docs"
  ON public.legal_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage legal docs"
  ON public.legal_documents FOR ALL TO authenticated
  USING (has_role(auth.uid(),'admin'::app_role))
  WITH CHECK (has_role(auth.uid(),'admin'::app_role));

-- 2. user_legal_acceptances
CREATE TABLE public.user_legal_acceptances (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  document_id uuid NOT NULL REFERENCES public.legal_documents(id) ON DELETE RESTRICT,
  kind text NOT NULL,
  version text NOT NULL,
  ip text,
  user_agent text,
  accepted_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_legal_acc_user ON public.user_legal_acceptances(user_id, kind, accepted_at DESC);

ALTER TABLE public.user_legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users insert own acceptance"
  ON public.user_legal_acceptances FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users view own acceptance"
  ON public.user_legal_acceptances FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'::app_role));

-- 3. privacy_settings
CREATE TABLE public.privacy_settings (
  user_id uuid PRIMARY KEY,
  hide_avatar_in_shared_goals boolean NOT NULL DEFAULT false,
  hide_contribution_amount boolean NOT NULL DEFAULT false,
  hide_profile_in_public_lists boolean NOT NULL DEFAULT false,
  require_invite_approval boolean NOT NULL DEFAULT false,
  disable_social_recommendations boolean NOT NULL DEFAULT false,
  hide_recent_activity boolean NOT NULL DEFAULT false,
  ai_use_financial_data boolean NOT NULL DEFAULT true,
  ai_use_business_data boolean NOT NULL DEFAULT true,
  email_essential boolean NOT NULL DEFAULT true,
  email_marketing boolean NOT NULL DEFAULT false,
  email_product_updates boolean NOT NULL DEFAULT true,
  email_financial_tips boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.privacy_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own privacy"
  ON public.privacy_settings FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own privacy"
  ON public.privacy_settings FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own privacy"
  ON public.privacy_settings FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.touch_privacy_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END $$;
CREATE TRIGGER trg_touch_privacy
  BEFORE UPDATE ON public.privacy_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_privacy_updated_at();

-- 4. Extend handle_new_user to create privacy_settings row
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'display_name');

  INSERT INTO public.subscriptions (user_id, plan, status)
  VALUES (NEW.id, 'free', 'active')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO public.privacy_settings (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- Backfill privacy_settings for existing users
INSERT INTO public.privacy_settings (user_id)
SELECT id FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- 5. has_accepted_current_legal
CREATE OR REPLACE FUNCTION public.has_accepted_current_legal(_uid uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT NOT EXISTS (
    SELECT 1 FROM public.legal_documents d
    WHERE d.is_current = true
      AND NOT EXISTS (
        SELECT 1 FROM public.user_legal_acceptances a
        WHERE a.user_id = _uid AND a.document_id = d.id
      )
  );
$$;

-- 6. Seed v1.0.0 of Terms and Privacy
INSERT INTO public.legal_documents (kind, version, content_md, is_current) VALUES
('terms','1.0.0', $md$# Termos de Uso

**Versão 1.0.0 — Vigente a partir de 21/05/2026**

Bem-vindo(a). Estes Termos descrevem as regras para uso do nosso app de finanças pessoais e empresariais ("Plataforma"). Ao criar uma conta, você concorda com tudo o que está aqui.

## 1. Sua conta
Você é responsável pelas informações que cadastra e por manter sua senha em segurança. Uma conta é pessoal e intransferível.

## 2. O que oferecemos
- Organização de finanças pessoais (transações, metas, cartões, orçamentos)
- Modo empresa para pequenas empresas
- Vaquinhas e metas compartilhadas
- Assistente Harp.I.A para sugestões educativas
- Cursos e conteúdos de educação financeira

A Plataforma é uma ferramenta de apoio. **Não somos instituição financeira nem oferecemos consultoria de investimento.**

## 3. Conduta
Você concorda em não:
- usar a Plataforma para fins ilegais
- tentar burlar segurança ou acessar dados de terceiros
- enviar conteúdo ofensivo em vaquinhas ou no suporte

## 4. Assinaturas e pagamentos
Planos pagos são processados pela **Stripe**. Você pode cancelar a qualquer momento; o acesso continua até o fim do período já pago. Reembolsos seguem a legislação vigente.

## 5. Propriedade intelectual
Todo o conteúdo da Plataforma (código, design, materiais de curso) pertence a nós ou a parceiros licenciados. Seus dados continuam sendo seus.

## 6. Encerramento de conta
Você pode excluir sua conta quando quiser. Podemos suspender contas que violem estes Termos.

## 7. Limitação de responsabilidade
Fazemos nosso melhor para manter tudo funcionando, mas a Plataforma é fornecida "como está". Decisões financeiras são sempre de sua responsabilidade.

## 8. Alterações destes Termos
Quando atualizarmos os Termos de forma relevante, pediremos um novo aceite antes que você continue usando o app.

## 9. Foro
Fica eleito o foro da comarca do domicílio do usuário para dirimir qualquer controvérsia.

## 10. Contato
Dúvidas? Fale com a gente pelo suporte dentro do app.
$md$, true),
('privacy','1.0.0', $md$# Política de Privacidade

**Versão 1.0.0 — Vigente a partir de 21/05/2026**

Sua privacidade é levada a sério. Esta política explica, em português claro, quais dados coletamos, como usamos e como você pode controlá-los. Estamos em conformidade com a **LGPD (Lei nº 13.709/2018)**.

## 1. Dados que coletamos
- **Cadastro:** nome, e-mail, foto (opcional)
- **Financeiros:** transações, metas, cartões, orçamentos — sempre criados por você
- **Empresariais:** dados da empresa que você decidir cadastrar no modo empresa
- **Uso:** páginas visitadas, ações realizadas, dispositivo, navegador
- **Suporte:** mensagens enviadas no chat de suporte

## 2. Como usamos
- Para operar o app e mostrar suas informações
- Para personalizar a experiência (com seu consentimento)
- Para detectar fraudes e proteger sua conta
- Para responder ao seu suporte
- Para enviar e-mails essenciais (cobrança, segurança) e, se você optar, dicas e novidades

## 3. Harp.I.A — nosso assistente
A Harp.I.A usa o modelo **Google Gemini** para gerar respostas. Por padrão, ela acessa seus dados financeiros para personalizar dicas. Você pode desativar isso em **Perfil → Privacidade**; nesse caso, ela responderá de forma genérica e educativa.

## 4. Vaquinhas e metas compartilhadas
Ao entrar em uma vaquinha, outros membros podem ver seu nome, avatar e valor contribuído. Você pode ocultar cada um desses itens individualmente em **Privacidade**.

## 5. Pagamentos
Cobranças são processadas pela **Stripe**. Não armazenamos dados completos do seu cartão — eles ficam protegidos no ambiente PCI-DSS da Stripe.

## 6. Onde seus dados ficam
Tudo é armazenado no **Supabase**, com criptografia em trânsito (TLS) e em repouso. Aplicamos políticas de acesso por linha (RLS) para garantir que ninguém veja o que não é seu.

## 7. Cookies e sessão
Usamos `localStorage` para manter você logado(a) e lembrar preferências (tema, idioma). Não usamos cookies de rastreamento publicitário.

## 8. Seus direitos (LGPD)
Você pode, a qualquer momento:
- acessar seus dados
- corrigir informações
- exportar seu histórico
- excluir sua conta e seus dados
- revogar consentimentos

Para exercer qualquer direito, use o suporte do app.

## 9. Retenção
Mantemos seus dados enquanto sua conta existir. Após exclusão, removemos em até 30 dias, exceto registros que a lei exija preservar.

## 10. Compartilhamento
Não vendemos seus dados. Compartilhamos apenas com prestadores essenciais (Stripe, Supabase, Google Gemini, provedor de e-mail) e somente o necessário.

## 11. Crianças
A Plataforma é destinada a maiores de 18 anos.

## 12. Mudanças nesta política
Quando mudarmos algo importante, pediremos um novo aceite antes de continuar.

## 13. Encarregado de dados (DPO)
Fale com nosso DPO pelo suporte do app.
$md$, true);
