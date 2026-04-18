

## Plano: Corrigir layout mobile

### Problemas identificados

1. **Abas (`TabsList`) estouram no mobile** — em `SpreadsheetsPage`, há 4 abas (Transações, Dashboard, Orçamento, Cartões) lado a lado com ícone + texto + botão CSV ao lado. No mobile (~360-390px) isso não cabe e empurra/corta conteúdo.

2. **`overflow-hidden` no container raiz** (`src/pages/Index.tsx` linha 11) — corta sombras, popovers e conteúdo que sai do limite. Deve ser `overflow-x-hidden` apenas.

3. **Tabela de transações** — `TransactionTable` usa `<table>` com várias colunas. Em mobile fica espremida ou exige scroll horizontal sem indicação visual clara.

4. **Cartões em grid** — `CardsTab` usa `grid-cols-1 sm:grid-cols-2`. OK, mas o detalhe do cartão tem 2 cards de resumo que ficam apertados em telas muito pequenas.

5. **Filtro de categorias** — já usa `ScrollArea` horizontal, OK.

6. **Diálogos** (`Nova Categoria`, `Recorrente`, etc.) — sem `max-h` + `overflow-y-auto`, podem cortar conteúdo em telas baixas.

### Mudanças propostas

**1. `src/pages/Index.tsx`**
- Trocar `overflow-hidden` por `overflow-x-hidden` no container raiz para não cortar verticalmente.

**2. `src/pages/SpreadsheetsPage.tsx`**
- Reorganizar a barra de abas: colocar `TabsList` e botão CSV em layout `flex-col sm:flex-row` com `gap-2` para empilhar no mobile.
- Tornar `TabsList` rolável horizontalmente (`overflow-x-auto`) com `w-full` e os triggers com `flex-shrink-0`. Esconder o texto em telas muito pequenas (`<span className="hidden xs:inline">`) deixando só o ícone, ou reduzir padding.
- Garantir que o título da página e descrição não vazem.

**3. `src/components/spreadsheets/TransactionTable.tsx`**
- Adicionar wrapper com indicação de scroll (`overflow-x-auto` já existe, ok). Reduzir padding horizontal (`px-2 sm:px-4`) e tornar a coluna de Categoria escondida no mobile (`hidden sm:table-cell`), exibindo a categoria abaixo da descrição em vez disso.

**4. `src/components/cards/CardsTab.tsx`**
- Garantir `min-w-0` nos cards de resumo (Gasto/Transações) para o texto não estourar. Já estão em `grid-cols-2`, ok.

**5. Diálogos** (em `SpreadsheetsPage`)
- Adicionar `max-h-[90vh] overflow-y-auto` no `DialogContent` do diálogo de Recorrência (que tem muitos campos).

### Detalhes técnicos
- Sem novos componentes nem dependências
- Sem mudanças de lógica — apenas classes Tailwind responsivas
- Breakpoints usados: `sm` (≥640px) padrão do Tailwind
- Mobile-first: começa pelo layout pequeno e expande

