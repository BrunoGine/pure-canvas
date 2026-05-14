## Sistema de Suporte (Tickets + Admin + Emails)

Vou construir um sistema completo de suporte tipo SaaS, pronto para produção, reaproveitando a infra Supabase já existente e o sistema de roles (`user_roles` + `has_role`) que já está no projeto.

---

### 1. Banco de dados (migration única)

**Tabelas novas:**

- `support_tickets`
  - `user_id`, `subject`, `category` (technical | financial | account | company | harp | suggestion | other), `priority` (low | normal | high | urgent), `status` (open | awaiting_user | awaiting_admin | resolved | closed), `last_message_at`
- `support_messages`
  - `ticket_id`, `sender_id`, `sender_role` (user | admin), `message`
- *(estrutura preparada para anexos/FAQ no futuro, sem implementar agora)*

**RLS:**
- Usuário vê/cria/responde apenas seus próprios tickets e mensagens.
- Admins (via `has_role(auth.uid(), 'admin')`) veem e atualizam tudo.
- Inserir admin role pra você manualmente via SQL (te aviso o comando).

**Triggers:**
- Atualizar `last_message_at` e `status` automaticamente ao inserir mensagem.
- Definir prioridade automática por categoria na criação.

---

### 2. Emails reais (produção)

Recomendo usar o **sistema de emails nativo do Lovable** (zero config, funciona em produção, com fila/retry, supressão e logs prontos). Você não precisa criar conta nem gerenciar API key.

Se preferir Resend explicitamente, me avise e troco — exigirá criar conta Resend, conectar via connector e te pedir a API key.

Fluxo (assumindo Lovable Emails):
1. Configurar domínio de envio (te apresento o botão de setup).
2. Provisionar infra de email + scaffold de emails transacionais.
3. Criar 3 templates React Email:
   - `ticket-created` → para admin(s)
   - `ticket-reply` → para usuário quando admin responde
   - `ticket-resolved` → confirmação ao usuário
4. Disparos a partir do frontend via `supabase.functions.invoke('send-transactional-email', ...)` com `idempotencyKey`.

---

### 3. Área do usuário

Nova rota `/suporte` (e atalho no `ProfilePage` no item "Ajuda").

- Lista de tickets (status colorido, último update, prévia da última msg)
- Botão "Abrir chamado" → dialog com assunto, categoria, descrição
- **Pré-triagem com Harp.IA** (baixo custo): antes de criar, usuário descreve o problema e a Harp tenta responder 1 vez (reaproveita edge function `harp-ia-chat` existente). Botões: "Resolveu meu problema" / "Abrir ticket mesmo assim".
- Tela de detalhe do ticket = chat contínuo (estilo WhatsApp/Intercom), com timestamps, bolhas user/admin, input fixo embaixo.
- Realtime via Supabase channel para novas mensagens.

---

### 4. Painel Admin

Rota protegida `/admin/suporte` (guard usando `useIsAdmin` que já existe).

- Lista global de tickets com filtros: status, prioridade, categoria, busca por assunto/usuário.
- Contadores no topo (abertos, aguardando admin, resolvidos hoje).
- Detalhe = mesmo componente de chat + painel lateral com info do usuário (nome, email, empresa ativa) + ações: responder, mudar status, marcar resolvido, fechar.

---

### 5. Design

- Estilo coerente com o app (cards arredondados, liquid-glass leve já usado).
- Status com cores semânticas via tokens do design system (sem cores hardcoded).
- Bolhas de chat, timestamps relativos, loading skeletons elegantes.

---

### 6. Segurança

- RLS em todas as tabelas.
- Rota `/admin/suporte` checa `useIsAdmin` antes de renderizar (e backend já fica protegido por RLS).
- Edge function de email valida que o caller é dono do ticket OU admin antes de enviar.

---

### 7. Arquitetura preparada para o futuro (sem implementar)

- Schema permite múltiplos admins (já funciona via `user_roles`).
- Campos extras reservados para anexos (`attachments jsonb`) e FAQ (`is_faq_candidate`).
- Estrutura de mensagens pronta pra notificações push depois.

---

### Arquivos a criar/editar

```text
supabase/migrations/<novo>.sql           (tabelas + RLS + triggers)
supabase/functions/_shared/transactional-email-templates/
  ├─ ticket-created.tsx
  ├─ ticket-reply.tsx
  └─ ticket-resolved.tsx
src/hooks/useSupportTickets.ts
src/hooks/useSupportMessages.ts
src/pages/SupportPage.tsx
src/pages/SupportTicketPage.tsx
src/pages/admin/AdminSupportPage.tsx
src/pages/admin/AdminSupportTicketPage.tsx
src/components/support/TicketList.tsx
src/components/support/TicketChat.tsx
src/components/support/NewTicketDialog.tsx        (com pré-triagem Harp)
src/components/support/StatusBadge.tsx
src/App.tsx                                       (novas rotas)
src/pages/ProfilePage.tsx                         (link "Suporte")
```

---

### Confirmações antes de eu começar

1. **Provedor de email**: posso seguir com **Lovable Emails** (recomendado, zero config), ou você quer mesmo **Resend**?
2. **Email de destino dos admins** para receber novos tickets (ex: `suporte@seudominio.com`).
3. Confirma que posso te promover a admin (inserir linha em `user_roles`)?