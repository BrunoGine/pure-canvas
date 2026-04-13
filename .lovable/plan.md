
## Planilhas por Categoria + Diferenciais

### O que será implementado

**1. Filtro por categoria na lista de transações**
- Barra de filtros horizontais (chips scrolláveis) acima da tabela de transações
- Chip "Todas" selecionado por padrão, seguido de cada categoria que possui transações
- Ao selecionar uma categoria, a tabela e os totais (receitas/despesas) atualizam para mostrar apenas aquela categoria

**2. Diferenciais sugeridos para implementar junto:**

- **Orçamento por categoria (Budget):** O usuário define um limite mensal para cada categoria. Um progress bar mostra quanto já gastou vs. o limite. Muda de cor (verde > amarelo > vermelho) conforme se aproxima do teto.

- **Resumo rápido por categoria:** Card expandível mostrando, para cada categoria: total gasto no mês, média por transação, quantidade de transações e variação vs. mês anterior (%).

- **Alerta de gasto excessivo:** Badge visual na categoria quando o gasto ultrapassa o orçamento definido ou quando há um aumento significativo vs. mês anterior.

### Escopo da implementação (primeira fase)

1. **Filtro por chips de categoria** no `SpreadsheetsPage.tsx` — estado `selectedCategory`, chips horizontais com scroll, filtragem das transações e recalculo dos totais
2. **Orçamento por categoria** — Dialog para definir limite, persistido em `localStorage`, progress bar no card de cada categoria no Dashboard
3. **Cards de resumo por categoria** — Novo componente `CategorySummaryCards` exibido quando uma categoria está selecionada, mostrando métricas rápidas

### Arquivos afetados
- `src/pages/SpreadsheetsPage.tsx` — filtro por chips, estado de orçamento, integração dos novos componentes
- `src/components/spreadsheets/TransactionTable.tsx` — receber filtro de categoria
- `src/components/spreadsheets/CategoryBudget.tsx` (novo) — componente de orçamento por categoria com progress bars
- `src/components/spreadsheets/CategoryBreakdown.tsx` — adicionar indicador de orçamento no gráfico
