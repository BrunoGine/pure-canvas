

# Open Finance — Plano de Implementação

## Contexto

O Open Finance no Brasil exige credenciamento junto ao Banco Central e certificados ICP-Brasil. Nenhuma aplicação pode conectar-se diretamente aos bancos sem isso. A solução é usar um **agregador** — uma plataforma já credenciada que expõe uma API simples.

## Recomendação: Pluggy

**Pluggy** é o agregador mais popular no Brasil para Open Finance. Motivos:
- API simples e bem documentada
- Widget pronto (Pluggy Connect) para o usuário autorizar suas contas
- Suporta os principais bancos brasileiros (Nubank, Itaú, Bradesco, BB, Inter, etc.)
- Retorna transações categorizadas, saldos e identidade
- Plano gratuito para desenvolvimento (sandbox com dados fictícios)

**Custo**: gratuito no sandbox; planos pagos a partir de ~R$99/mês para produção.

## Arquitetura

```text
┌──────────────┐     ┌──────────────────┐     ┌─────────────┐
│  App React   │────▶│  Edge Function   │────▶│  Pluggy API │
│  (frontend)  │     │  (Supabase)      │     │             │
└──────────────┘     └──────────────────┘     └─────────────┘
       │                      │
       │                      ▼
       │              ┌──────────────┐
       └─────────────▶│  Supabase DB │
                      │  (transações)│
                      └──────────────┘
```

## Etapas de implementação

### 1. Criar conta na Pluggy e obter API keys
- O usuário cria conta em https://pluggy.ai
- Obtém `CLIENT_ID` e `CLIENT_SECRET` do dashboard
- Salvamos como secrets no Supabase

### 2. Migração do banco de dados
- Criar tabela `bank_connections` (id, user_id, pluggy_item_id, institution_name, status, etc.)
- Criar tabela `bank_transactions` (id, user_id, connection_id, description, amount, date, category, type, pluggy_transaction_id)
- Criar tabela `bank_accounts` (id, user_id, connection_id, name, balance, type)
- RLS para que cada usuário veja apenas seus próprios dados

### 3. Edge Function: `pluggy-api`
- Endpoint para gerar access token (client_credentials)
- Endpoint para criar Connect Token (abre o widget no frontend)
- Endpoint para buscar contas e transações de um Item
- Webhook para receber notificações de atualização da Pluggy

### 4. Frontend: Fluxo de conexão bancária
- Botão "Conectar banco" na página de planilhas
- Abre o widget Pluggy Connect (iframe/SDK JS)
- Após sucesso, salva o `itemId` na tabela `bank_connections`
- Dispara busca de contas e transações

### 5. Sincronização e geração de planilhas
- Buscar transações da Pluggy e salvar em `bank_transactions`
- A página de Planilhas passa a mostrar transações reais (do banco) junto com as manuais
- Filtros por banco, período, categoria
- Resumos automáticos (receitas, despesas, saldo por conta)

### 6. Exportação
- Botão para exportar planilha em .xlsx com as transações sincronizadas

## Detalhes técnicos

- **Pluggy Connect Widget**: script JS `https://cdn.pluggy.ai/pluggy-connect/v2/pluggy-connect.js` — abre modal para o usuário autenticar no banco
- **Auth flow**: Edge function gera `connectToken` via API Pluggy → frontend usa o token no widget → widget retorna `itemId` → edge function busca transações com esse item
- **Secrets necessários**: `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`
- **Tabelas com RLS**: todas as novas tabelas terão políticas limitando acesso ao `auth.uid() = user_id`

## Primeira etapa prática

Podemos começar com o **sandbox da Pluggy** (dados fictícios) para você testar todo o fluxo sem precisar conectar um banco real. Depois basta trocar as credenciais para produção.

**Para começar, você precisa:**
1. Criar conta gratuita em https://pluggy.ai
2. Me informar quando tiver o `CLIENT_ID` e `CLIENT_SECRET` do dashboard

Deseja prosseguir?

