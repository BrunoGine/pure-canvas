# Painel Administrativo Completo de Usuários

Sistema profissional de gestão de contas, inspirado em Stripe/Supabase/Linear, com ações reais (não fake), segurança server-side via RPCs SECURITY DEFINER + RLS, e UX moderna.

## 1. Banco de dados (migração única)

### Novas colunas em `profiles`
- `account_status` enum `account_status` (`active` | `suspended` | `banned` | `deleted`) default `active`
- `status_reason` text
- `status_changed_at` timestamptz
- `status_changed_by` uuid
- `last_seen_at` timestamptz (atualizado por RPC `touch_last_seen` chamada no login/heartbeat)
- `login_count` int default 0
- `deleted_at` timestamptz (soft delete)

### Nova tabela `admin_logs`
- `id`, `admin_id`, `action` text (`grant_override`, `revoke_override`, `suspend_user`, `ban_user`, `unsuspend_user`, `soft_delete_user`, `hard_delete_user`, `restore_user`)
- `target_user_id`, `metadata` jsonb, `created_at`
- RLS: SELECT só admin; INSERT só via RPC (policy `false`).

### Funções SECURITY DEFINER (todas com guard `has_role(auth.uid(),'admin')`)
- `admin_list_users(_search text, _status text, _plan text, _inactive_days int, _limit int, _offset int)` → retorna linhas com profile + plano efetivo + contadores (transactions, goals, companies) + `last_seen_at` + total count. Usa LATERAL/COUNTs com limites para performance.
- `admin_get_user_detail(_user_id uuid)` → dados completos: profile, email (auth.users), subscription, override ativo, histórico de overrides, contadores, últimas 10 ações de admin sobre ele.
- `admin_set_account_status(_user_id, _status, _reason)` → atualiza profiles + insere admin_log. Se `banned`/`suspended`, chama `auth.admin` via edge function (ver §3) para revogar sessões.
- `admin_soft_delete_user(_user_id, _reason)` → marca `account_status='deleted'`, `deleted_at=now()`, log.
- `admin_restore_user(_user_id)` → volta para `active`, limpa `deleted_at`, log.
- `admin_metrics()` → KPIs: total, ativos hoje (last_seen_at > now()-24h), novos 7d/30d, premium/enterprise (via get_effective_plan), empresas, trials ativos, inativos 30d, suspended/banned.
- `touch_last_seen()` → atualiza last_seen_at + login_count++; chamada no AuthContext em SIGNED_IN.
- Reescrever `admin_grant_override`/`admin_revoke_override` para também inserir em `admin_logs`.

### Gate de acesso
- Atualizar `handle_new_user` para setar `account_status='active'`.
- Adicionar RPC `current_account_status()` (stable, security definer) usada pelo cliente para detectar suspensão/ban e mostrar tela de bloqueio.
- RLS adicional em `manual_transactions`/`goals` INSERT: bloquear quando `account_status != 'active'` via função `is_account_active(auth.uid())`.

## 2. Edge function `admin-user-actions`

Necessária para operações que exigem `service_role` (revogar sessões / deletar usuário do `auth.users`):
- POST `{action: 'revoke_sessions'|'hard_delete', user_id, reason}`
- Verifica JWT do chamador → checa `has_role(..., 'admin')`.
- `revoke_sessions`: `supabase.auth.admin.signOut(user_id, 'global')`.
- `hard_delete`: chama `admin_soft_delete_user` para auditoria + `supabase.auth.admin.deleteUser(user_id)` (cascata remove dados via FKs existentes; profile/subscription via trigger ou cleanup explícito). Insere admin_log `hard_delete_user`.

## 3. Frontend

### Rotas (registradas em `src/pages/Index.tsx`)
- `/admin` → `AdminDashboardPage` (KPIs + atalhos)
- `/admin/usuarios` → `AdminUsersPage` (tabela + busca + filtros + paginação)
- `/admin/usuarios/:id` → `AdminUserDetailPage` (perfil completo + ações)
- `/admin/assinaturas` → já existe
- `/admin/logs` → `AdminLogsPage` (timeline de ações admin)

Guard `<AdminRoute>` usa `useIsAdmin`; redireciona não-admins para `/`.

### Componentes
- `src/components/admin/AdminShell.tsx`: layout com sidebar (Dashboard, Usuários, Assinaturas, Logs, Suporte) estilo Linear/Supabase.
- `src/components/admin/MetricCard.tsx`, `UserStatusBadge.tsx`, `PlanBadge.tsx`.
- `src/components/admin/UsersTable.tsx`: tabela sticky header, skeleton loading, paginação server-side, debounce 300ms na busca, filtros (status, plano, inatividade), preserva filtros via URL params.
- `src/components/admin/UserActionsDialog.tsx`: confirmação dupla para ban/delete (digitar email).
- `src/components/admin/SubscriptionPanel.tsx`: reaproveita lógica de grant/revoke da página atual em forma de painel embutido no detalhe.

### Hooks
- `useAdminUsers(filters)` — react-query com `keepPreviousData`, chave inclui filtros, RPC `admin_list_users`.
- `useAdminUserDetail(id)`, `useAdminMetrics()`, `useAdminLogs(filters)`.
- `useAdminUserMutations()`: suspend/unsuspend/ban/soft_delete/restore/hard_delete/revoke_sessions; invalida queries relevantes; toast de sucesso/erro.

### Gate de conta bloqueada
- `useAccountStatus()` consulta `current_account_status` no SecurityContext (ou novo `AccountStatusGate`).
- Se `suspended` → tela amigável "Sua conta está suspensa" + motivo + botão suporte; logout forçado opcional.
- Se `banned` → tela "Conta banida" + signOut imediato.
- Se `deleted` → tela "Conta excluída" + signOut.

### Link de admin
- Substituir links soltos no `ProfilePage` por entrada única "Painel Admin" → `/admin`.

## 4. Segurança

- Toda ação admin: RPC SECURITY DEFINER com `has_role` guard + RLS bloqueia escrita direta.
- Edge function valida JWT e role antes de usar service_role.
- Frontend nunca toca tabelas sensíveis diretamente; só lê via RPCs.
- Hard delete pede confirmação textual (digitar email).
- `admin_logs` imutável (sem UPDATE/DELETE policy).
- Sessões revogadas no momento da suspensão/ban.

## 5. Performance

- `admin_list_users` paginada (limit 25, offset). Total via `count(*) OVER ()`.
- Contadores por usuário via subqueries com COUNT — ok para escala média; índices em `manual_transactions(user_id)`, `goals(user_id)`, `companies(user_id)` (criar se faltarem).
- React Query com `staleTime: 30s` + `keepPreviousData`.
- Realtime apenas em `admin_logs` no dashboard de logs (opcional).

## 6. Ordem de implementação

1. Migração: enum, colunas, tabela `admin_logs`, todas as RPCs, índices.
2. Edge function `admin-user-actions`.
3. Hooks + componentes base (AdminShell, MetricCard, UsersTable).
4. Páginas: Dashboard, Users, UserDetail, Logs.
5. AccountStatusGate + integração no AuthedShell.
6. `touch_last_seen` no AuthContext.
7. Atualizar ProfilePage com link único Admin.

## Fora de escopo (fase 2)

- Notificação por email ao usuário ao suspender/banir.
- Exportar CSV de usuários.
- Bulk actions (selecionar múltiplos).
- Gráficos temporais (apenas KPIs numéricos nesta fase).
