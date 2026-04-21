

## Plano — Corrigir bugs dos gráficos

### Bugs identificados

1. **% some em fatias pequenas** (`CategoryBreakdown`) — o label só renderiza se `percent >= 5%`, fatias menores ficam sem rótulo.
2. **Clique seleciona tudo / comportamento errado** — clicar na Legend do recharts dispara o comportamento padrão de "esconder série", o que esvazia o gráfico. Além disso, o `onClick` do `<Pie>` do recharts dispara o evento mesmo em zonas vazias, podendo resetar a seleção.
3. **Travamentos / re-animação** — toda mudança de filtro ou de seleção remonta as `<Cell>` com novas props (`fillOpacity`, `stroke`), reiniciando a animação de 800 ms. Combinado com `scrollIntoView({ behavior: "smooth" })` a cada toggle, gera lag perceptível em listas grandes.
4. **Tooltip pisca** (visto no session replay) — `Tooltip` sem `isAnimationActive={false}` re-renderiza no formato animado a cada hover; com fatias pequenas adjacentes alterna rápido demais.

### Correções

**`src/components/spreadsheets/CategoryBreakdown.tsx`**

- **Label sempre visível em fatias ≥ 3%**, e para fatias < 3% renderizar o % **fora** da fatia (com linha guia curta) em vez de sumir. Exemplo:
  ```ts
  if (percent < 0.03) {
    // posicionar fora: radius = outerRadius + 12, fill = foreground
    return <text ... fill="hsl(var(--foreground))">{(percent*100).toFixed(0)}%</text>;
  }
  ```
- **Desabilitar clique/toggle da Legend** passando `onClick={undefined}` e usando `<Legend ... formatter={...} />` apenas para exibição; ou trocar por uma legenda customizada simples (mais leve).
- **Estabilizar animação**:
  - Adicionar `isAnimationActive={false}` no `<Pie>` (ou `animationDuration={300}` com `animationBegin={0}` e remover re-trigger usando `key` estável).
  - Adicionar `isAnimationActive={false}` no `<Tooltip>` para parar o piscar.
- **Clique mais robusto**:
  - Usar `onClick` em cada `<Cell>` (com `data.name` capturado) em vez de no `<Pie>`, evitando que o handler receba o objeto errado quando o usuário clica nas bordas.
  - Adicionar `event.stopPropagation()` no handler do `<button>` da lista para não conflitar.
- **Remover `scrollIntoView` smooth** — trocar por `behavior: "auto"` ou remover totalmente (a lista é curta, max-h 200px com scroll já basta).

**`src/components/cards/CardsTab.tsx`** (gráfico de pizza dentro do cartão)

- Adicionar `isAnimationActive={false}` no `<Pie>` e `<Tooltip>` para evitar piscar/lag ao trocar filtro Crédito/Débito.
- Usar `paddingAngle={2}` (em vez de 4) para fatias pequenas não desaparecerem visualmente.

**`src/components/spreadsheets/MonthlyOverview.tsx`** e **`CategorySpendingDialog.tsx`** (BarCharts)

- Adicionar `isAnimationActive={false}` no `<Tooltip>` apenas (gráfico de barras já é estável; só o tooltip pisca).

### Observações

- Sem mudanças de dados, sem novas dependências.
- As animações de entrada permanecem ativas no `MonthlyOverview` (BarChart) — só o que pisca em hover é desativado.
- O comportamento de clique na lista de categorias (abaixo do gráfico) continua funcionando normalmente e fica como forma "primária" de selecionar; o clique no gráfico vira complementar e mais robusto.

