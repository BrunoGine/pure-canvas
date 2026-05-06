# Reformulação da Aba Orçamento

## Visão geral

Substituir o componente atual `CategoryBudget` (que salva no `localStorage`) por uma aba completa de Orçamentos com persistência no Supabase, CRUD, barra de progresso colorida por uso, e UI moderna no padrão glass do app.

## 1. Banco de dados (migration)

Criar tabela `budgets`:

```text
budgets
├── id              uuid PK
├── user_id         uuid (auth.uid())
├── category        text          -- nome da categoria do usuário
├── limit_amount    numeric > 0
├── period          text default 'monthly'
├── created_at      timestamptz
└── updated_at      timestamptz
UNIQUE (user_id, category)        -- 1 orçamento por categoria
```

- RLS habilitado, 4 policies (SELECT/INSERT/UPDATE/DELETE) com `auth.uid() = user_id`.
- Trigger `updated_at`.
- `current_spent` **não** é coluna — calculado no client a partir das `manual_transactions` do mês atual (sem custo extra, sem IA).

## 2. Hook `useBudgets`

Novo arquivo `src/hooks/useBudgets.ts`:
- `budgets`, `loading`
- `addBudget({ category, limit_amount })`
- `updateBudget(id, patch)`
- `removeBudget(id)`
- Pub/sub leve (mesmo padrão de `useCreditCards`) para sincronizar entre instâncias.
- Toasts de sucesso/erro.

## 3. Componente `BudgetsTab`

Novo `src/components/spreadsheets/BudgetsTab.tsx` substituindo o uso de `CategoryBudget`:

**Header**
- Título "Orçamentos" + botão "Criar orçamento" (abre dialog).

**Lista (cards glass)**
Para cada budget:
- Nome da categoria (com ícone genérico Wallet).
- `R$ gasto / R$ limite` + percentual.
- Barra de progresso com cor dinâmica:
  - verde até 60%, amarelo 60–90%, vermelho >90%.
  - >100% mostra badge "Excedido" + ícone alerta pulsante.
- Botões Editar (Pencil) e Excluir (Trash2) no canto.
- Ordenação: por % de uso desc.

**Estado vazio**
- Ícone + mensagem "Nenhum orçamento ainda" + botão "Criar primeiro orçamento".

**Cálculo de gasto**
- Recebe `transactions` por prop (já carregadas na page) — sem nova query.
- `spent = sum(|amount|)` onde `type='expense'`, `category===budget.category`, mês/ano atuais.

## 4. Dialogs

`BudgetFormDialog` (criar/editar):
- Select de categoria (lista vinda de `categories` da page — mesma fonte usada hoje).
  - No modo criar: oculta categorias que já têm orçamento.
  - No modo editar: categoria fixa (somente leitura) ou trocável evitando duplicatas.
- Input numérico `limit_amount` (validação > 0).
- Botão Salvar.

`AlertDialog` de confirmação para exclusão (não toca em transações).

## 5. Integração em `SpreadsheetsPage.tsx`

- Remover import e uso de `CategoryBudget` + estado `budgets` localStorage.
- Substituir o conteúdo do `TabsContent value="budget"` por `<BudgetsTab transactions={txForCharts} categories={categories} />`.
- Para os "chips" de categoria que mostram bolinha de "estourou orçamento", trocar a fonte de `budgets` (localStorage) por valores vindos do hook `useBudgets` (mapeados em `Record<category, limit>`).

## 6. Migração de dados existentes

Nenhuma — orçamentos antigos viviam só em `localStorage`. Opcional: na primeira montagem do hook, se `localStorage["finapp-budgets"]` existir e não houver budgets no servidor, oferecer migrar (fora do escopo padrão; pular para manter simples).

## 7. Detalhes técnicos

- Sem chamadas a IA.
- Sem loops de re-fetch — o hook escuta apenas mutações próprias.
- Validação client-side com checagem simples (sem nova lib).
- Componentes seguem `glass-card`, `rounded-xl`, sombras suaves já usados no app.

## Arquivos

**Criar**
- `supabase/migrations/<timestamp>_budgets.sql`
- `src/hooks/useBudgets.ts`
- `src/components/spreadsheets/BudgetsTab.tsx`
- `src/components/spreadsheets/BudgetFormDialog.tsx`

**Editar**
- `src/pages/SpreadsheetsPage.tsx` (trocar conteúdo da aba + remover estado `budgets` local; adaptar chips)

**Manter (não usar mais)**
- `src/components/spreadsheets/CategoryBudget.tsx` pode ser removido após troca.
