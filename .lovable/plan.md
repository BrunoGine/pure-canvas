

## Plano

### 1. Filtro de método (Crédito / Débito / Ambos) nos gráficos
No `CategoryBreakdown` (gráfico de pizza por categorias) tem um Select que filtra entrada/saída. Vou adicionar **um segundo Select** ao lado, com as opções: **Ambos** (default), **Crédito**, **Débito**.

- Filtra `transactions` por `payment_method` antes de agrupar:
  - `Ambos` → todas as transações (comportamento atual)
  - `Crédito` → apenas `payment_method === "credito"`
  - `Débito` → apenas `payment_method === "debito"`
- Aplicar o **mesmo filtro também no `MonthlyOverview`** (gráfico de barras mensal) para consistência — mesmo Select de método no header do card.
- Para que o filtro funcione, preciso passar `payment_method` no objeto `txForCharts` (em `SpreadsheetsPage.tsx` linha 149-151) que hoje só inclui `id, description, amount, date, category, type`. Vou adicionar `payment_method` ao mapeamento e aos types `Transaction` dos dois componentes.

### 2. Mostrar valor da fatura do cartão
Adicionar um card de **"Fatura atual"** dentro da view de detalhe de cartão em `CardsTab.tsx` (quando o usuário clica num cartão).

**Cálculo da fatura** (baseado no `closing_day` do cartão):
- Fatura atual = soma de transações de **crédito** (`payment_method === "credito"`) vinculadas ao cartão (`card_id`) entre **(closing_day do mês anterior + 1)** e **closing_day do mês atual**.
- Próxima fatura = soma das transações entre o último fechamento e hoje, projetando até o próximo fechamento (gastos já lançados que cairão na próxima fatura).

**UI proposta** (substitui/expande o grid atual de "Gasto no mês" e "Transações"):
- Grid 2 colunas:
  - **Fatura atual** (ciclo fechado mais recente) — destaque grande
  - **Próxima fatura** (ciclo em aberto)
- Mantém abaixo: "Gasto no mês" e "Transações" como já está, ou unifica.

Também adicionar pequeno indicador no `CardVisual` (lista de cartões) com "Fatura: R$ X" abaixo de "Fecha dia N", para o usuário ver de relance sem entrar no cartão.

### Arquivos afetados
- `src/components/spreadsheets/CategoryBreakdown.tsx` — adicionar Select de método + filtro
- `src/components/spreadsheets/MonthlyOverview.tsx` — adicionar Select de método + filtro
- `src/pages/SpreadsheetsPage.tsx` — incluir `payment_method` em `txForCharts`
- `src/components/cards/CardsTab.tsx` — calcular e exibir fatura atual + próxima fatura
- `src/components/cards/CardVisual.tsx` — adicionar prop opcional `invoiceAmount` e renderizar no rodapé

### Observações
- Sem novas dependências, sem migração de DB.
- O filtro "Ambos" inclui também transações sem `payment_method` definido (legacy) ou de outros métodos (Pix, dinheiro etc.) — comportamento atual preservado como default.
- Fatura considera apenas `payment_method = 'credito'` (débito desconta na hora, não vira fatura).

