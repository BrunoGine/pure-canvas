

## Plano

### Mudança
Adicionar um filtro de método de pagamento (**Ambos** / **Crédito** / **Débito**) no gráfico "Gastos por categoria" que aparece dentro da view de detalhe do cartão (`CardsTab.tsx`), quando o usuário clica em um cartão.

### Comportamento
- **Ambos** (default) — todas as transações do cartão (comportamento atual)
- **Crédito** — apenas `payment_method === "credito"`
- **Débito** — apenas `payment_method === "debito"`

O filtro afeta apenas o gráfico de pizza "Gastos por categoria". Os outros indicadores (Fatura atual, Próxima fatura, Gasto no mês, Transações, tabela) permanecem inalterados.

### Arquivo afetado

**`src/components/cards/CardsTab.tsx`**
- Adicionar estado `categoryMethodFilter` (`"all" | "credito" | "debito"`).
- Trocar o `useMemo` `categoryData` para filtrar `cardTxs` por `payment_method` antes de agrupar por categoria.
- Adicionar um `Select` compacto no header do card "Gastos por categoria" (ao lado do título), com opções: Ambos / Crédito / Débito.
- Importar `Select`, `SelectContent`, `SelectItem`, `SelectTrigger`, `SelectValue` de `@/components/ui/select`.

### Observações
- Apenas 3 opções (Ambos/Crédito/Débito) — não toda a lista de `paymentMethods`, pois cartão só usa esses dois métodos na prática.
- Sem mudanças de DB, sem novas dependências.
- Mantém o padrão visual dos outros filtros do app (mesmo `Select` compacto).

