
# Sistema de Privacidade + Termos de Uso

Implementação completa, persistente e funcional — sem UI fake. Cada toggle afeta de verdade UI, queries, IA e vaquinhas.

---

## 1. Banco de dados (migration única)

### Tabela `legal_documents`
Armazena versões publicadas de Termos e Política.
- `kind` ('terms' | 'privacy')
- `version` (text, ex: "1.0.0")
- `content_md` (markdown)
- `published_at`
- `is_current` (boolean)

RLS: leitura pública autenticada; escrita só admin.

### Tabela `user_legal_acceptances`
Histórico de aceites (preserva auditoria).
- `user_id`, `document_id`, `kind`, `version`, `accepted_at`, `ip` (opcional), `user_agent` (opcional)

RLS: usuário insere/lê o próprio; admin lê tudo.

### Tabela `privacy_settings` (1:1 com usuário, colunas tipadas — sem JSON bagunçado)
Colunas booleanas com default seguro:
- `hide_avatar_in_shared_goals` (default false)
- `hide_contribution_amount` (default false)
- `hide_profile_in_public_lists` (default false)
- `require_invite_approval` (default false)
- `disable_social_recommendations` (default false)
- `hide_recent_activity` (default false)
- `ai_use_financial_data` (default true)
- `ai_use_business_data` (default true)
- `email_essential` (default true, sempre true — não desativável)
- `email_marketing` (default false)
- `email_product_updates` (default true)
- `email_financial_tips` (default true)
- `created_at`, `updated_at`

RLS: SELECT/INSERT/UPDATE próprio (`auth.uid() = user_id`).

Trigger: criar linha automática no `handle_new_user()` (estender função existente).

### Função RPC `has_accepted_current_legal(uid)`
Retorna boolean — compara aceite mais recente com versão `is_current`. Usada no gate de reaceite.

### Seed
Inserir versão "1.0.0" dos dois documentos com `is_current=true`.

---

## 2. Conteúdo dos documentos

Escrever Termos e Política em PT-BR, tom Pierre/Nubank — claro, humano, profissional. Markdown salvo no banco (renderizado com `react-markdown` já comum no stack ou simples parser).

Seções obrigatórias da Política:
- Quais dados coletamos (cadastro, financeiros, uso)
- Uso da IA Harp (Gemini) e o que ela acessa
- Dados financeiros e segurança
- Armazenamento (Supabase) e retenção
- Suporte
- Assinaturas e pagamentos (Stripe)
- Modo empresa
- Vaquinhas e metas compartilhadas
- Cookies/session/localStorage
- LGPD: direitos do titular, DPO contato
- Exclusão de conta
- Responsabilidade do usuário
- Limitações de responsabilidade
- Como notificamos mudanças (reaceite)

Termos: contrato de uso, conta, conduta, propriedade intelectual, assinatura/cancelamento, foro.

---

## 3. Aceite no cadastro

Editar `src/components/auth/SignupCredentialsStep.tsx`:
- Adicionar checkbox obrigatório: "Li e aceito os [Termos de Uso] e a [Política de Privacidade]"
- Links abrem `Dialog` (ou nova rota `/legal/termos` e `/legal/privacidade`) que carregam o markdown do banco
- Botão "Continuar" desabilitado até marcar
- Após signup bem-sucedido: inserir 2 linhas em `user_legal_acceptances` (terms + privacy versão atual)

OAuth/callback: no `AuthCallbackPage`, se primeiro login e sem aceite, redirecionar para tela de aceite antes do onboarding.

---

## 4. Gate de reaceite

Novo componente `LegalGate` em `App.tsx` (dentro de `ProtectedRoutes`, antes do onboarding check):
- Chama RPC `has_accepted_current_legal`
- Se falso → redireciona para `/legal/aceite` com checkbox + botões
- Bloqueia o resto do app até aceitar a nova versão

---

## 5. Tela de Privacidade

Nova rota `/privacidade` (adicionar em `App.tsx` e `ProtectedRoutes`).
Editar `ProfilePage.tsx`: trocar `action: () => {}` do item "Privacidade" por `navigate("/privacidade")`.

### `src/pages/PrivacyPage.tsx`
- Header com voltar
- Hook `usePrivacySettings()` (novo) com React Query: fetch + mutation com debounce 400ms e optimistic update
- Seções agrupadas:
  1. **Vaquinhas e metas compartilhadas** — hide_avatar, hide_contribution_amount, require_invite_approval
  2. **Perfil público** — hide_profile_in_public_lists, hide_recent_activity, disable_social_recommendations
  3. **Harp.I.A** — ai_use_financial_data, ai_use_business_data
  4. **E-mails** — marketing, product_updates, financial_tips (essential bloqueado/explicado)
- Cada item: `<PrivacyToggleRow title description checked onChange loading />`
- Feedback: micro-spinner inline + toast "Preferência salva"
- Design: glass-card, mesmo padrão de `ProfilePage`

---

## 6. Aplicação REAL das preferências

Esta é a parte crítica — cada toggle precisa ter efeito.

### Vaquinhas (`SharedGoalCard`, `SharedGoalDetailDialog`, `useSharedGoals`)
- Criar RPC `get_shared_goal_members_safe(goal_id)` que retorna membros respeitando a privacidade de cada um:
  - se `hide_avatar_in_shared_goals` → `avatar_url = null`
  - se `hide_profile_in_public_lists` → `display_name = "Membro"`
  - se `hide_contribution_amount` → `total_contributed = null`
- Substituir chamadas atuais a `get_shared_goal_profiles` por essa nova RPC com join em `privacy_settings`
- UI: quando `total_contributed = null`, mostrar "—" no ranking

### Convite aprovado (`require_invite_approval`)
- Em `JoinSharedGoalDialog` / fluxo de join: se admin tem flag, request entra como `pending` em `shared_goal_join_requests` (já existe a tabela). Caso contrário, fluxo direto atual.
- Trigger ou lógica no hook que verifica `privacy_settings.require_invite_approval` do **criador** antes de adicionar membro.

### Harp.I.A (`supabase/functions/harp-ia-chat/index.ts`)
- No início da função, ler `privacy_settings` do usuário (via service role)
- Se `ai_use_financial_data = false` → não anexar transações/metas/orçamentos ao prompt; system prompt instrui resposta genérica
- Se `ai_use_business_data = false` e contexto é empresarial → idem para dados de `companies`
- Adicionar nota no system prompt: "O usuário restringiu acesso aos dados financeiros pessoais; responda de forma genérica e educativa."

### Atividade recente / badges / certificados públicos
- Hoje são privados por RLS. Documentar que `hide_recent_activity` afetará futuras telas públicas; aplicar já em qualquer listagem cross-user existente (revisar `SharedGoalDetailDialog` para não mostrar badges de outros membros se flag ligada).

### E-mails (`send-transactional-email`)
- Antes de enviar, checar categoria vs `privacy_settings`:
  - `marketing` → respeita `email_marketing`
  - `product-updates` → respeita `email_product_updates`
  - `financial-tips` → respeita `email_financial_tips`
  - transacionais essenciais (payment-failed, support-reply, subscription-confirmed) → sempre enviam
- Mapear templates existentes em `transactional-email-templates/registry.ts` para categorias.

### Recomendações sociais
- Sem feature ativa hoje — apenas reservar a flag. Documentar no código com TODO claro.

---

## 7. Hooks/utilitários

- `src/hooks/usePrivacySettings.ts` — React Query, cache global, optimistic updates
- `src/hooks/useLegalDocuments.ts` — fetch documento atual por kind
- `src/lib/privacy.ts` — helpers `applyMemberPrivacy(member, settings)` para uso client-side onde necessário

---

## 8. Estabilidade e performance

- `privacy_settings` lidas uma vez por sessão e mantidas em React Query (`staleTime: 5min`)
- Mutations com debounce evitam spam de UPDATE
- Edge functions leem direto do Postgres (não chamam o app)
- RLS testada com linter após migration

---

## 9. Arquivos a criar / editar

**Criar:**
- Migration (tabelas + RPC + seed + trigger update no handle_new_user)
- `src/pages/PrivacyPage.tsx`
- `src/pages/LegalPage.tsx` (visualização de termos/privacidade)
- `src/pages/LegalAcceptPage.tsx` (gate de reaceite)
- `src/components/privacy/PrivacyToggleRow.tsx`
- `src/components/legal/LegalAcceptCheckbox.tsx`
- `src/hooks/usePrivacySettings.ts`
- `src/hooks/useLegalDocuments.ts`
- `src/hooks/useLegalAcceptance.ts`
- `src/lib/privacy.ts`

**Editar:**
- `src/App.tsx` (rotas + LegalGate)
- `src/components/auth/SignupCredentialsStep.tsx` (checkbox + registro de aceite)
- `src/pages/ProfilePage.tsx` (link Privacidade real)
- `src/pages/AuthCallbackPage.tsx` (verificar aceite pós-OAuth)
- `src/hooks/useSharedGoals.ts` + componentes de vaquinha (aplicar privacidade)
- `src/components/goals/JoinSharedGoalDialog.tsx` (fluxo de aprovação)
- `supabase/functions/harp-ia-chat/index.ts` (respeitar flags de IA)
- `supabase/functions/send-transactional-email/index.ts` (respeitar opt-ins)

---

## 10. Entrega em fases (numa única implementação, mas verificável por etapa)

1. Migration + seed + RPCs
2. Aceite no signup + gate de reaceite + páginas legais
3. Tela de Privacidade + hook + persistência
4. Aplicação real: vaquinhas, IA, e-mails
5. QA: alternar cada toggle e validar efeito

Pronto para implementar quando você aprovar.
