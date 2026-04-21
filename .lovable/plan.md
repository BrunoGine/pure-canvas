

## Plano — Corrigir seleção do gráfico de categorias

### Bugs reportados
1. **Linha branca em volta do gráfico** — ao clicar numa fatia, aparece um contorno (outline) em volta do `<svg>` ou da fatia.
2. **Não troca de seleção** — ao clicar numa fatia diferente, a seleção não muda.
3. **Não des-seleciona ao clicar fora** — clicar fora do gráfico/lista não limpa o `selectedCategory`.

### Causa
- A "linha branca" é o **focus outline padrão do navegador** no `<path>` SVG após o clique (recharts adiciona `tabIndex` por padrão nos elementos do gráfico). Também o `stroke="hsl(var(--foreground))" strokeWidth={2}` desenha um contorno branco no tema escuro na fatia selecionada — quando o usuário "vê linha branca em volta" pode ser esse stroke aplicado de forma errada.
- O `onClick` no `<Cell>` do recharts às vezes **não dispara corretamente** em re-renders quando o `key` muda; o handler captura `entry.name` no closure no momento do render e o evento bubbles diferente. Resultado: clicar numa nova fatia não atualiza para o novo nome.
- **Não há listener para "clicar fora"** — qualquer clique fora dos botões/fatias é ignorado.

### Correções em `src/components/spreadsheets/CategoryBreakdown.tsx`

1. **Remover focus outline e stroke branco**:
   - Adicionar `outline-none focus:outline-none [&_path]:outline-none [&_path:focus]:outline-none` no wrapper do `ResponsiveContainer`.
   - Trocar o destaque da fatia selecionada: em vez de `stroke="hsl(var(--foreground))"` (branco no dark), usar **aumento sutil do raio + fillOpacity 1**, e manter as outras fatias com `fillOpacity 0.35`. Sem stroke nenhum.

2. **Clique robusto na fatia**:
   - Trocar handler do `<Cell>` por `onClick` no `<Pie>` usando o callback `(data) => toggleCategory(data.name)` — recharts passa o data point clicado de forma confiável.
   - Garantir que `toggleCategory` use `prev` (já usa) e que o `useEffect` de scroll não interfira.

3. **Clicar fora des-seleciona**:
   - Envolver o conteúdo do `Card` numa `div` com `ref` e usar um `useEffect` que escuta `mousedown` no `document`: se o alvo não estiver dentro da `ref`, limpar `selectedCategory`.
   - Alternativamente (mais simples): adicionar `onClick` no `<Card>` que limpa a seleção, e nos botões/`<Pie>` chamar `e.stopPropagation()` para não propagar.

4. **Pequeno ajuste visual**: pode-se aumentar `outerRadius` da fatia selecionada (via `activeIndex` + `activeShape` do recharts) para feedback claro sem usar stroke. Implementação:
   ```tsx
   <Pie
     activeIndex={selectedIndex}
     activeShape={(props) => <Sector {...props} outerRadius={props.outerRadius + 6} />}
     onClick={(d) => toggleCategory(d.name)}
     ...
   />
   ```
   Importar `Sector` do recharts.

### Resultado
- Sem linha branca ao clicar.
- Clicar em outra fatia troca a seleção.
- Clicar fora do card (ou em área vazia dentro dele) limpa a seleção.
- Sem mudanças de dados, sem novas dependências.

