## Visão geral

Monetização em 3 planos com arquitetura desacoplada de gateway, trial de 1 mês do Premium sem cartão, paywall moderno (estilo Duolingo Super / Notion AI) e bloqueios contextuais — cursos visíveis com cadeado, Empresa apresentada via card promocional.

**Decisões confirmadas**
- Gateway: **Stripe (Lovable Payments)** — checkout seamless
- Preços BRL: Premium R$ 14,90/mês • R$ 143/ano · Empresa R$ 34,90/mês • R$ 335/ano
- Trial: 1 mês de Premium sem cartão; ao expirar abre paywall
- Bloqueios: cursos visíveis com 🔒 · Empresa via card promo dedicado

---

## 1. Modelo de dados (migration)

**Enum** `subscription_plan`: `free | premium | enterprise`
**Enum** `subscription_status`: `active | trialing | expired | canceled | past_due`

**Tabela `subscriptions`** (1 por usuário, fonte da verdade)
- user_id (uuid, unique), plan, status
- trial_started_at, trial_ends_at
- current_period_end, cancel_at_period_end (bool)
- billing_interval (`month`|`year`), price_cents, currency (default `BRL`)
- gateway (`stripe`|`mercadopago`|`none`), gateway_customer_id, gateway_subscription_id
- coupon_code (nullable — futuro)
- created_at, updated_at

RLS: usuário lê o próprio registro; só edge functions (service role) escrevem.

**Tabela `plans`** (catálogo declarativo, seedada via migration)
- key (pk: `free`/`premium`/`enterprise`), name, tagline
- price_monthly_cents, price_yearly_cents, currency
- features (jsonb — array de benefícios para o paywall)
- highlight (bool — "Mais Popular" no Premium)
- gateway_price_id_monthly, gateway_price_id_yearly (preenchidos depois)

Leitura pública (authenticated).

**Trigger**: ao criar profile (`handle_new_user`), inserir `subscriptions` com `plan=free, status=active`.

---

## 2. Lógica de permissões

**Arquivo** `src/lib/plans.ts` — single source of truth no front:
- `PlanKey`, `Feature` (`courses.watch`, `enterprise.access`, `harpia.advanced`, `reports.advanced`, `badge.premium`)
- `FEATURE_MATRIX: Record<PlanKey, Feature[]>`
- `hasFeature(plan, feature)`, `getEffectivePlan(subscription)` (considera trial ativo como `premium`)

**Hook** `src/hooks/useSubscription.ts`
- Carrega `subscriptions` do user + escuta realtime
- Retorna `{ plan, effectivePlan, isTrialing, trialDaysLeft, isPremium, isEnterprise, can(feature) }`

**Componente** `<FeatureGate feature="..." fallback={<LockedCard/>}>` para envolver áreas pagas.

**Hook** `useUpgradeModal()` — abre o paywall contextualmente com `{ trigger: 'courses'|'enterprise'|'harpia'|... }` para copy dinâmica.

---

## 3. Paywall premium (`src/pages/PricingPage.tsx`)

Rota `/planos`. Layout inspirado em Duolingo Super + Notion AI:

- **Hero**: headline transformacional ("Domine seu dinheiro com a Harp.I.A.") + toggle Mensal/Anual com badge "economize 20%"
- **3 cards** lado a lado (mobile: stack), liquid glass com gradiente sutil:
  - Free: outline discreto, CTA "Continuar grátis"
  - **Premium**: card maior, badge "💎 Mais Popular", glow leve, gradiente primary→primary-glow, CTA gigante **"Começar 1 mês grátis"**, microcopy "sem cartão • cancele quando quiser"
  - Empresa: visual corporativo (tons mais sóbrios + ícone 🏢), CTA "Gerenciar minha empresa"
- **Tabela comparativa** abaixo (mobile: accordion) — copy focada em transformação ("Entenda para onde seu dinheiro está indo" em vez de "10 relatórios")
- **FAQ** + selo de segurança
- Animações: framer-motion no card destacado (subtle scale/glow), entrada stagger

**Componentes novos**
- `PlanCard`, `PricingToggle`, `FeatureComparison`, `PaywallDialog` (modal reutilizável p/ triggers contextuais)
- `TrialBanner` (topo do app quando `isTrialing`, mostra dias restantes + CTA upgrade)

---

## 4. Trial e checkout

**Edge function `start-trial`**
- Valida usuário, exige `subscriptions.trial_started_at IS NULL` (1× só)
- Define `plan=premium, status=trialing, trial_started_at=now, trial_ends_at=now+30d`
- Log em `ai_usage_log`-style audit (opcional)

**Edge function `create-checkout`** (Stripe)
- Input: `{ plan: 'premium'|'enterprise', interval: 'month'|'year' }`
- Cria Stripe Checkout Session com price_id correspondente
- Retorna `url` para redirect

**Edge function `stripe-webhook`**
- Eventos: `checkout.session.completed`, `customer.subscription.updated/deleted`, `invoice.payment_failed`
- Atualiza `subscriptions` (service role)

**Edge function `customer-portal`** (gerenciar/cancelar)

**Job de expiração** (edge function `expire-trials` chamada por cron diário ou checada client-side no `useSubscription`): se `trial_ends_at < now` e ainda `trialing` → `plan=free, status=expired`.

---

## 5. Bloqueios contextuais

- **Cursos** (`/cursos`, lista): cards continuam visíveis. Ao clicar em curso sem acesso (free, não-trial), abre `PaywallDialog` com trigger `courses` em vez de navegar. Ícone 🔒 + badge "Premium" no card.
- **Minha Empresa**: na sidebar/menu, item visível. Se não tem `enterprise.access`, rota `/empresa` renderiza `<EnterprisePromo />` (apresentação dedicada: mockup do dashboard, balanço, IA empresarial, fluxo de caixa) com CTA "Desbloquear Empresa".
- **Harp.I.A. avançada**: free tem N perguntas/dia (limite preparado via `ai_usage_log` já existente — não bloqueia agora, só estrutura `checkAIQuota()`).
- **TrialBanner** dispensável (localStorage) para não irritar.

---

## 6. Integração Stripe (Lovable Payments)

Fluxo de ativação:
1. Rodar `recommend_payment_provider` para validar fit
2. Confirmar com usuário e chamar `enable_stripe_payments`
3. Após enable: definir estratégia de impostos (provavelmente `automatic_tax` para BR ou nenhuma)
4. Criar 4 produtos via `batch_create_product`: Premium mensal/anual + Empresa mensal/anual
5. Salvar price_ids na tabela `plans`
6. Implementar `create-checkout`, `customer-portal`, `stripe-webhook`

---

## 7. Estrutura futura (apenas preparar)

- Coluna `coupon_code` em `subscriptions` + tabela `coupons` (não criar agora, deixar comentado)
- Campo `gateway` permite alternar provider sem refactor
- `FEATURE_MATRIX` permite criar tiers intermediários (ex: Premium Pro) só editando o map

---

## 8. Detalhes técnicos

**Arquivos novos**
```
src/lib/plans.ts
src/hooks/useSubscription.ts
src/hooks/useUpgradeModal.ts
src/components/billing/PlanCard.tsx
src/components/billing/PricingToggle.tsx
src/components/billing/FeatureComparison.tsx
src/components/billing/PaywallDialog.tsx
src/components/billing/TrialBanner.tsx
src/components/billing/FeatureGate.tsx
src/components/billing/EnterprisePromo.tsx
src/pages/PricingPage.tsx
supabase/functions/start-trial/index.ts
supabase/functions/create-checkout/index.ts
supabase/functions/customer-portal/index.ts
supabase/functions/stripe-webhook/index.ts
supabase/functions/expire-trials/index.ts
```

**Arquivos editados**
- `src/App.tsx` — rota `/planos`, `TrialBanner` global
- `src/pages/CoursesPage.tsx` (ou equivalente) — wrap clique com `PaywallDialog`
- `src/pages/Empresa*.tsx` — gate com `<EnterprisePromo />`
- `src/pages/ProfilePage.tsx` — seção "Meu plano" com CTA portal/upgrade
- `supabase/functions/harp-ia-chat/index.ts` — passar a chamar `checkAIQuota()` (estrutura, sem bloquear ainda)

**Migration única** cria: enums, `subscriptions`, `plans`, seed dos 3 planos, RLS, trigger no `handle_new_user`.

**Segredos**: Stripe Lovable Payments cuida das chaves; apenas confirmar no enable.

---

## 9. Ordem de implementação

1. Migration (tabelas + seed) → aprovação
2. `plans.ts` + `useSubscription` + `FeatureGate` + `PaywallDialog`
3. `PricingPage` + `PlanCard` + `TrialBanner`
4. Edge function `start-trial` + ligação no CTA do paywall
5. Bloqueios contextuais (cursos + Empresa promo)
6. Ativar Stripe Lovable Payments + criar produtos + price_ids
7. Checkout + webhook + customer portal
8. Job de expiração de trial