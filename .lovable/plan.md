

## Plano — Ajustes de seleção do gráfico

### Mudanças em `src/components/spreadsheets/CategoryBreakdown.tsx`

1. **Clicar fora limpa seleção (em qualquer lugar da página, não só no card)**
   - Adicionar um `useEffect` com listener `mousedown` no `document` que limpa `selectedCategory` quando o clique acontece fora do `Card` do gráfico.
   - Usar uma `ref` no elemento root do `Card` para detectar se o clique foi dentro ou fora.
   - Remover o `onClick={() => setSelectedCategory(null)}` atual no `<Card>` (que só funcionava clicando dentro), já que o listener global cobre isso.
   - Manter os `e.stopPropagation()` nos botões da lista e nos selects de filtro para que cliques neles não disparem deseleção indevida — na verdade, com o listener global por "fora do card", isso já deixa de ser problema, mas mantemos para segurança.

2. **Clicar no rótulo (%) seleciona a categoria**
   - Atualmente `renderCustomLabel` retorna `<text>` sem handler. Adicionar `onClick` no `<text>` que chama `toggleCategory(name)`, com `cursor: pointer` e `pointer-events: all`.
   - Para isso, passar o `name` da fatia para o label: o recharts já entrega `payload` no callback do `label`, então usamos `payload.name` (ou `name` direto do parâmetro).
   - Tanto o label interno (fatias ≥ 3%) quanto o externo (fatias < 3%) ficam clicáveis.
   - Adicionar `e.stopPropagation()` no handler do `<text>` para não disparar o listener global de "clicar fora".

### Resultado
- Clicar em qualquer lugar fora do card de "Gráfico de Categorias" limpa a seleção.
- Clicar no número de porcentagem (dentro ou fora da fatia) seleciona/deseleciona a categoria correspondente, igual a clicar na fatia.
- Sem mudanças de dados, sem novas dependências.

