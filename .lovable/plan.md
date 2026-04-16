

## Plano: Ajustes no "Gastos por categoria"

### Investigação
Preciso ler `src/components/spreadsheets/CategoryBreakdown.tsx` para entender a estrutura atual (título, filtro com "Todos", e gráficos exibidos ao clicar numa categoria).

### Alterações em `CategoryBreakdown.tsx`

1. **Título**: trocar "Gastos por categoria" → "Gráfico de Categorias"
2. **Filtro de tipo**: remover a opção "Todos", deixando apenas "Entradas" e "Saídas". Definir o valor inicial como "Saídas" (ou o que estiver fazendo mais sentido) já que não haverá mais "Todos".
3. **Remover gráficos ao clicar numa categoria**: remover o drill-down/gráficos secundários que aparecem ao selecionar uma categoria. Manter apenas o gráfico principal de categorias.

### Detalhes técnicos
- Garantir que ao remover "Todos", o estado padrão do filtro seja válido
- Remover handlers de clique e estado relacionado aos sub-gráficos
- Não alterar lógica de cálculo, apenas UI/interação

