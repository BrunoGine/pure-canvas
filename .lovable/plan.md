

## Plano: Mover "Orçamento por Categoria" para uma aba

### Objetivo
Adicionar uma terceira aba "Orçamento" ao lado de "Transações" e "Dashboard" na página de planilhas, movendo o componente `CategoryBudget` para dentro dela.

### Investigação necessária
Preciso confirmar a estrutura atual de tabs em `SpreadsheetsPage.tsx` e onde o `CategoryBudget` está renderizado hoje.

### Alterações

**`src/pages/SpreadsheetsPage.tsx`**
- Adicionar uma nova `TabsTrigger` "Orçamento" no `TabsList` (que passará de 2 para 3 colunas — `grid-cols-3`)
- Criar uma nova `TabsContent value="budget"` contendo o componente `CategoryBudget`
- Remover o `CategoryBudget` da localização atual (provavelmente dentro da aba Dashboard ou fora das tabs)
- Manter as props existentes: `transactions`, `categories`, `budgets`, `onUpdateBudgets`

### Detalhes técnicos
- Usar ícone do `lucide-react` (ex: `Wallet` ou `Target`) no trigger para consistência visual com as outras abas
- Garantir que o estado de `budgets` continue sendo gerenciado no `SpreadsheetsPage` e passado por props
- Nenhuma mudança na lógica do `CategoryBudget.tsx` em si

