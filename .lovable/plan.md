# Concessão Manual de Assinaturas (Overrides)

Sistema híbrido: Stripe continua dono das assinaturas pagas; uma nova camada de **overrides** permite que admins liberem Premium/Empresa gratuitamente, por tempo determinado ou vitalício, sem tocar na tabela `subscriptions`.

## 1. Banco de dados

Nova tabela `subscription_overrides`:

- `id` uuid PK
- `user_id` uuid (não FK para auth.users)
- `plan_type` enum (`premium` | `enterprise`) — reusa `subscription_plan`
- `starts_at` timestamptz default now()
- `expires_at` timestamptz nullable (NULL = vitalício)
- `granted_by` uuid (admin)
- `reason` text (Beta, Influenciador, Parceiro, etc.)
- `active` boolean default true
- `revoked_at` / `revoked_by` nullable
- `created_at` timestamptz

Índice em `(user_id, active)`.

**RLS:**
- SELECT: próprio usuário (vê só ativos seus) + admin (vê tudo)
- INSERT/UPDATE/DELETE: apenas admin (via `has_role(auth.uid(), 'admin')`)

**Função SECURITY DEFINER** `get_effective_plan(_user_id uuid)` retornando `subscription_plan`:
1. Se existe override ativo (`active=true`, `starts_at<=now()`, `expires_at IS NULL OR expires_at>now()`) → retorna maior plano do override (enterprise > premium).
2. Senão consulta `subscriptions` (active/trialing válido) → retorna plano.
3. Senão `free`.

**Função** `admin_grant_override(_user_id, _plan, _duration_days, _reason)` — SECURITY DEFINER, checa `has_role(auth.uid(),'admin')`, insere override (expires_at = NULL se duration_days IS NULL).

**Função** `admin_revoke_override(_override_id)` — idem, marca `active=false`, `revoked_at`, `revoked_by`.

**Função** `admin_search_users(_query text)` — SECURITY DEFINER, retorna `id, display_name, email` (lendo `auth.users` + `profiles`) limitado a 20, somente para admins. Usada no painel.

## 2. Frontend

**`src/hooks/useSubscription.ts`**: passa a chamar RPC `get_effective_plan` em paralelo à query atual; `effectivePlan` usa o resultado. Mantém estrutura para não quebrar consumidores. Inscreve realtime também em `subscription_overrides` filtrando por `user_id`.

**`src/lib/plans.ts`**: adicionar tipo opcional `OverrideRecord` e helper `mergePlans(stripePlan, overridePlan)` (enterprise > premium > free).

**Novo `src/pages/admin/AdminSubscriptionsPage.tsx`** (rota `/admin/assinaturas`, protegida por `useIsAdmin`):
- Busca de usuário por nome/email (debounced, via RPC)
- Card do usuário selecionado: plano Stripe atual, override ativo (se houver), expiração
- Form: plano (premium/enterprise), duração (7d / 30d / 60d / 90d / vitalício / customizado), motivo (select + texto livre)
- Botão "Conceder" e "Revogar atual"
- Tabela: histórico de overrides do usuário

**`src/components/admin/AdminNav.tsx`** (ou link no `AdminSupportPage`): adicionar entrada "Assinaturas".

**`src/App.tsx`**: registrar rota `/admin/assinaturas`.

## 3. Segurança

- Toda concessão/revogação roteada via funções SECURITY DEFINER com guard `has_role`.
- RLS impede usuário comum de inserir/alterar override.
- `useIsAdmin` já é server-side (consulta `user_roles`).
- Logs implícitos via `granted_by`/`revoked_by`/`reason`.

## 4. Migrações e ordem

1. Migration: enum reuso, tabela, RLS, funções.
2. Atualizar `useSubscription` + `plans.ts`.
3. Criar página admin + rota + link.
4. Testar fluxo: conceder 7d, verificar `effectivePlan=premium`, revogar, verificar volta para free.

## Fora de escopo

- Notificação por email ao conceder (pode ser fase 2).
- UI para o próprio usuário ver "cortesia ativa" (mostraremos apenas o badge de plano atual).

```text
[admin painel] --RPC--> admin_grant_override
                              |
                              v
                  subscription_overrides
                              |
[useSubscription] --RPC--> get_effective_plan <-- subscriptions (Stripe)
```
