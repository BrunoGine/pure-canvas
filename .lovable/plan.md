

## Plano

### 1. Sincronizar categorias entre "Nova Transação" e "Transação Recorrente"
As categorias customizadas já são compartilhadas (mesma fonte `customCategories`/`removedDefaults` no `SpreadsheetsPage`), mas o `Select` do diálogo de recorrência **não tem** as opções "Criar categoria" e "Remover categoria". 
- Em `src/pages/SpreadsheetsPage.tsx`, no `Select` do `recCategory` (linhas 403–410), adicionar os mesmos itens `__create__` e `__remove__` que disparam os mesmos diálogos já existentes (`setCategoryDialogOpen` / `setRemoveCategoryDialogOpen`).
- Resultado: criar categoria em qualquer lugar aparece imediatamente nos dois selects.

### 2. Adicionar opção de cartão na Transação Recorrente
- Adicionar estado `recCardId` (default `"none"`) no `SpreadsheetsPage`.
- No diálogo de recorrência, adicionar `Select` de cartão (mesmo padrão do form de Nova Transação) — só aparece quando o método for `credito` ou `debito` (ver item 3).
- Estender `RecurringTransaction` em `src/hooks/useRecurringTransactions.ts` com `card_id?: string | null`, incluir nos `select(...)` e no `insert(...)`.
- **Migração DB**: adicionar coluna `card_id uuid` (nullable) em `recurring_transactions`.
- Atualizar `supabase/functions/process-recurring-transactions/index.ts` para copiar `card_id` e `payment_method` ao inserir em `manual_transactions` (atualmente o edge function não copia esses campos — bug existente).

### 3. Mostrar campo de cartão apenas para Crédito/Débito
- Em **Nova Transação** (linha 340): trocar a condição `type === "expense" && cards.length > 0` por `(paymentMethod === "credito" || paymentMethod === "debito") && cards.length > 0`. Quando o método mudar para outro valor, resetar `cardId` para `"none"`.
- Em **Transação Recorrente**: aplicar a mesma regra com `recPaymentMethod`.
- No `addTransaction` (linha 118), simplificar para `card_id: cardId !== "none" ? cardId : null` (a condicional do método já controla a visibilidade).

### Arquivos afetados
- `src/pages/SpreadsheetsPage.tsx` — UI condicional + select de cartão no recorrente + sync de categorias
- `src/hooks/useRecurringTransactions.ts` — incluir `card_id`
- `supabase/functions/process-recurring-transactions/index.ts` — propagar `card_id` e `payment_method`
- Migração DB: `ALTER TABLE recurring_transactions ADD COLUMN card_id uuid;`

### Observações
- Sem mudanças visuais além do select de cartão aparecer/sumir conforme método.
- Sem novas dependências.
- Categorias permanecem em `localStorage` (fora do escopo migrar para DB agora).

