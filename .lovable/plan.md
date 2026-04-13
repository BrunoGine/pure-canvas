

## Redesign Visual dos Gráficos

### Problemas atuais
- Gráficos com visual padrão do recharts, sem personalização
- Tooltips genéricos, sem glassmorphism
- Sem gradientes nas barras/áreas
- Grid lines muito visíveis e sem refinamento
- Cores "chapadas" sem profundidade

### O que será feito

**1. Paleta de cores moderna com gradientes**
- Substituir cores sólidas por gradientes usando `<defs>` + `<linearGradient>` no SVG do recharts
- Receitas: gradiente azul (primary → accent)
- Despesas: gradiente vermelho suave
- Categorias: paleta harmônica com tons pastel vibrantes

**2. Tooltips com glassmorphism**
- Todos os tooltips receberão `backdrop-filter: blur()`, background semi-transparente, `border-radius: 12px` e sombra suave — alinhados ao design system glass já existente no projeto

**3. Grid e eixos refinados**
- Grid com opacidade baixa (0.1), `strokeDasharray` mais fino
- Eixos com cor mais suave, sem linhas de eixo (axisLine=false, tickLine=false)
- Fontes menores e espaçadas

**4. Barras com bordas arredondadas e sombra**
- `radius={[6,6,0,0]}` em todas as barras
- Barras com leve transparência e hover effect via `activeBar`

**5. Gráfico de pizza/donut melhorado**
- Espaçamento maior entre fatias (`paddingAngle={4}`)
- Sombra interna, labels percentuais customizados
- Animação suave de entrada

**6. Área com gradiente fade**
- AreaCharts com `fillOpacity` gradiente (de 0.4 no topo a 0 na base)
- Linhas com `strokeWidth={2.5}` e dots estilizados

### Arquivos afetados
- `src/components/spreadsheets/MonthlyOverview.tsx` — gradientes nas barras, tooltip glass, grid refinado
- `src/components/spreadsheets/CategoryBreakdown.tsx` — pie chart melhorado, gradientes em todos os sub-gráficos, tooltip glass
- `src/components/spreadsheets/CategorySpendingDialog.tsx` — mesmo tratamento visual: gradientes, tooltip, grid

