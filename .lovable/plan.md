

## Plano: Destacar categoria selecionada no gráfico

### Objetivo
Ao clicar numa fatia do gráfico de pizza (ou num item da lista) em `CategoryBreakdown.tsx`, destacar visualmente a categoria correspondente na lista abaixo.

### Investigação
Já li o `CategoryBreakdown.tsx`. Hoje não há estado de seleção — clicar não faz nada. Preciso adicionar:
- Estado `selectedCategory` (string | null)
- Handler de clique no `Pie` (onClick na fatia) e nos itens da lista
- Estilo de destaque na lista quando o item está selecionado
- Toggle: clicar de novo na mesma categoria desmarca

### Alterações em `src/components/spreadsheets/CategoryBreakdown.tsx`

1. **Novo estado**: `const [selectedCategory, setSelectedCategory] = useState<string | null>(null)`

2. **Handler de clique**:
   - No `Pie`: `onClick={(d) => setSelectedCategory(prev => prev === d.name ? null : d.name)}`
   - No item da lista: mesmo handler, transformando o `<div>` num `<button>` para acessibilidade

3. **Destaque visual no item selecionado da lista**:
   - Borda/background mais forte (ex: `bg-secondary ring-1 ring-primary/40`)
   - Quando há seleção, os outros itens ficam com `opacity-50` para reforçar o destaque
   - Scroll automático até o item selecionado (opcional, usando `ref` + `scrollIntoView({ block: "nearest" })`)

4. **Destaque visual na fatia do gráfico**:
   - Aumentar `outerRadius` da fatia selecionada (ex: 80 → 88) usando a prop `activeIndex`/`activeShape` do Recharts, OU reduzir opacidade das outras fatias via `<Cell fillOpacity={...}>`

5. **Reset**: ao trocar o filtro (`filterType`), limpar `selectedCategory`

### Detalhes técnicos
- Cursor `cursor-pointer` nas fatias e itens
- Sem novos componentes — apenas estado e estilos condicionais
- Sem alteração de lógica de cálculo

