

## Plano: Renomear "Receita/Despesa" para "Entrada/Saída"

Trocar todos os textos visíveis ao usuário de "Receita"→"Entrada" e "Despesa"→"Saída" para linguagem mais acessível. Os valores internos (`type: "income" | "expense"`) permanecem iguais no banco e no código.

### Arquivos a alterar

1. **`src/pages/SpreadsheetsPage.tsx`** — labels do formulário, select de tipo, botões, textos
2. **`src/pages/HomePage.tsx`** — cards de "Receitas"→"Entradas" e "Despesas"→"Saídas"
3. **`src/components/spreadsheets/CategoryBreakdown.tsx`** — se houver menção a receita/despesa
4. **`src/components/spreadsheets/CategorySummaryCards.tsx`** — cards de resumo
5. **`src/components/spreadsheets/MonthlyOverview.tsx`** — se houver labels

### Substituições
| De | Para |
|---|---|
| Receita / Receitas | Entrada / Entradas |
| Despesa / Despesas | Saída / Saídas |
| income (label visível) | Entrada |
| expense (label visível) | Saída |

Nenhuma alteração no banco de dados ou lógica — apenas textos exibidos na interface.

