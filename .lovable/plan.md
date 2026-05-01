# Metas Compartilhadas (Vaquinhas)

Sistema paralelo às metas individuais, na mesma Home, permitindo grupos com admin, membros, código de convite e contribuições com aprovação. Sem uso de IA. Reaproveita visual atual (glass-card, gradientes, presets de ícone).

## 1. Banco de dados (migration)

Quatro tabelas novas + enums. Todas com RLS por participação (via funções `SECURITY DEFINER` para evitar recursão).

**Enums**
- `shared_goal_role`: `admin | member`
- `shared_request_status`: `pending | approved | rejected`

**Tabelas**

`shared_goals`
- id, name, target_amount, current_amount (default 0), preset_key (text, ex.: "travel"), invite_code (text unique, 8 chars), created_by (uuid), is_completed (bool), completed_at, created_at, updated_at

`shared_goal_members`
- id, shared_goal_id, user_id, role (`shared_goal_role`), total_contributed (numeric default 0), joined_at
- UNIQUE (shared_goal_id, user_id)

`shared_goal_join_requests`
- id, shared_goal_id, user_id, status (`shared_request_status` default pending), created_at, decided_at, decided_by
- UNIQUE (shared_goal_id, user_id) where status = 'pending' (índice parcial)

`shared_goal_contributions`
- id, shared_goal_id, user_id, amount, status (default pending), created_at, decided_at, decided_by, transaction_id (uuid nullable — referência à `manual_transactions` criada após aprovação)

`manual_transactions`: adicionar coluna `shared_goal_id uuid` (nullable) para vincular saídas/entradas da vaquinha às transações pessoais do contribuinte.

**Funções SECURITY DEFINER (evitar recursão RLS)**
- `is_shared_goal_member(_goal uuid, _user uuid) returns bool`
- `is_shared_goal_admin(_goal uuid, _user uuid) returns bool`
- `gen_invite_code() returns text` (8 chars alfanuméricos únicos)

**Trigger `validate_shared_goal`** (BEFORE INSERT/UPDATE em `shared_goals`):
- target_amount > 0; current_amount ≥ 0; marcar `is_completed/completed_at` quando atinge alvo; preencher `invite_code` se vazio.

**Trigger `on_shared_goal_created`** (AFTER INSERT em `shared_goals`):
- Inserir o `created_by` em `shared_goal_members` como `admin`.

**RLS (resumo)**
- `shared_goals` SELECT: membro (via `is_shared_goal_member`) OU lookup por `invite_code` (policy de SELECT para autenticados em consulta com filtro de invite — implementado como SELECT público apenas dos campos via função `find_shared_goal_by_code(code)` SECURITY DEFINER que retorna nome, ícone, contagem). INSERT: `auth.uid() = created_by`. UPDATE/DELETE: `is_shared_goal_admin`.
- `shared_goal_members` SELECT: membro do mesmo goal. INSERT: somente o próprio user OU admin. UPDATE/DELETE: admin.
- `shared_goal_join_requests` SELECT: dono da request OU admin do goal. INSERT: `auth.uid() = user_id`. UPDATE: admin do goal.
- `shared_goal_contributions` SELECT: membro do goal. INSERT: `auth.uid() = user_id` E membro. UPDATE: admin do goal (para aprovar/rejeitar).

## 2. Hook `useSharedGoals.ts`

Carrega todas as vaquinhas onde o usuário é membro, com agregados (member_count, my_role). Métodos:
- `createSharedGoal({ name, target_amount, preset_key })` → retorna invite_code
- `joinByCode(code)` → cria join_request
- `approveJoinRequest(id)` / `rejectJoinRequest(id)` → admin
- `requestContribution(goalId, amount)` → cria contribution pendente
- `approveContribution(id)` → admin: cria `manual_transactions` (type=expense, category="Meta compartilhada", description=`Vaquinha: <nome>`, shared_goal_id), soma current_amount, soma total_contributed do membro, marca contribution approved + transaction_id
- `rejectContribution(id)` → admin: status=rejected, sem transação
- `withdrawFromShared(goalId, amount)` → admin: subtrai current_amount, cria `manual_transactions` (type=income) para o admin que retirou
- `removeMember(memberId)` / `promoteMember(memberId)` → admin
- `deleteSharedGoal(goalId)` → admin

Toda operação sensível valida no cliente E confia em RLS para bloqueio real.

## 3. UI

**`SharedGoalsSection.tsx`** (na HomePage, abaixo de `GoalsSection`):
- Header "👥 Metas Compartilhadas" + botões "Criar vaquinha" / "Entrar com código".
- Grid de `SharedGoalCard` (mesmo visual de `GoalCard`, com preset gradient + ícone, badge de nº de membros, badge "Admin" quando aplicável, barra de progresso).
- Click no card abre `SharedGoalDetailDialog`.

**`CreateSharedGoalDialog.tsx`**: nome, valor objetivo, grid de presets (reaproveita `GOAL_PRESETS`). Após criar, mostra invite_code com botão "Copiar" e Web Share API quando disponível.

**`JoinSharedGoalDialog.tsx`**: input do código → cria request → toast "Solicitação enviada, aguarde aprovação".

**`SharedGoalDetailDialog.tsx`** com tabs (`@/components/ui/tabs`):
- **Resumo**: progresso, descrição, código (somente admin), botões "Adicionar valor" (todos), "Retirar" (admin), "Excluir" (admin).
- **Membros**: lista com avatar/nome (via `profiles`), valor contribuído, role. Admin vê ações (promover, remover).
- **Solicitações** (somente admin): pending join requests + pending contributions, com aprovar/rejeitar.
- **Ranking**: membros ordenados por `total_contributed DESC` (posição, nome, valor).
- **Histórico**: contribuições aprovadas (quem, valor, data) + retiradas.

**Diálogos auxiliares**:
- `SharedContributeDialog`: input de valor → `requestContribution` → toast "Aguardando aprovação do admin".
- `SharedWithdrawDialog`: somente admin.
- `SharedGoalCompletedDialog`: modal de conclusão (reusa padrão de `GoalCompletedDialog` com confete).

## 4. Notificações internas (sem IA)

Badge simples de contagem ao lado do título "Metas Compartilhadas" mostrando total de pendências (join requests + contribuições) onde o usuário é admin. Implementado via `select count` no hook. Sem realtime nesta entrega — refetch ao abrir/fechar diálogos.

## 5. Regras de segurança

- Valores ≤ 0 rejeitados no client e no trigger.
- Aprovação de contribuição é transacional no client: insere transação → atualiza contribution → atualiza goal/member. Em caso de falha intermediária, rollback manual via delete da transação criada.
- Retirada nunca pode passar de `current_amount`.
- Excluir vaquinha: se houver `current_amount > 0`, devolver proporcionalmente? **Não** — para evitar complexidade financeira, exclusão exigirá zerar via retiradas primeiro (validação no client + bloqueio por confirmação). Membros simplesmente são removidos em cascade (`ON DELETE CASCADE` nas tabelas filhas).

## 6. Visual

Mesmo padrão das metas individuais: `glass-card`, `bg-gradient-to-br` com presets, `Progress`, `framer-motion`. Ícones Lucide. Sem novas dependências.

## Arquivos a criar/editar

**Migration**: `supabase/migrations/<timestamp>_shared_goals.sql`

**Novos**:
- `src/hooks/useSharedGoals.ts`
- `src/components/goals/SharedGoalsSection.tsx`
- `src/components/goals/SharedGoalCard.tsx`
- `src/components/goals/CreateSharedGoalDialog.tsx`
- `src/components/goals/JoinSharedGoalDialog.tsx`
- `src/components/goals/SharedGoalDetailDialog.tsx`
- `src/components/goals/SharedContributeDialog.tsx`
- `src/components/goals/SharedWithdrawDialog.tsx`

**Editar**:
- `src/pages/HomePage.tsx` — montar `<SharedGoalsSection />` logo após `<GoalsSection />`.

Sem novas Edge Functions, sem novas chamadas de IA, sem novos secrets.
