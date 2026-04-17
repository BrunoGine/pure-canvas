

## Plano: Aba "Cartões"

### Objetivo
Adicionar uma 4ª aba "Cartões" em `SpreadsheetsPage` para cadastrar cartões de crédito (nome, banco, bandeira, dia de fechamento da fatura) com visual de cartão ilustrado, lista de transações vinculadas e gráficos de gastos.

### Backend — nova tabela `credit_cards`
Migração:
- `id uuid pk`, `user_id uuid not null`, `name text`, `bank text` (slug ex: nubank, itau, bradesco, santander, inter, c6, bb, caixa), `brand text` (visa, mastercard, elo, amex, hipercard), `closing_day int 1–31`, `color text` (cor de fundo do cartão), `created_at`, `updated_at`
- RLS: 4 policies (select/insert/update/delete) com `auth.uid() = user_id`

### Vincular transações ao cartão
Adicionar coluna opcional `card_id uuid` em `manual_transactions` (nullable — não quebra dados existentes).
- Atualizar `useTransactions` para carregar/salvar `card_id`
- No formulário "Nova Transação" (apenas quando `type = expense`), aparece um Select opcional "Cartão" listando os cartões cadastrados

### Frontend

**Novos arquivos:**
- `src/hooks/useCreditCards.ts` — CRUD (fetch/add/remove/update) idêntico ao padrão de `useTransactions`
- `src/components/cards/CardVisual.tsx` — desenho do cartão (gradiente da cor do banco, logo do banco no canto superior esquerdo, logo da bandeira no canto inferior direito, nome do titular, "Fecha dia XX"). Logos serão SVGs inline simples/estilizados (não usar marcas reais com risco — usar representações simplificadas: círculos sobrepostos para Mastercard, monograma "VISA" estilizado para Visa, etc.)
- `src/components/cards/CardForm.tsx` — Dialog com campos: Nome, Banco (Select com opções pré-definidas), Bandeira (Select), Dia de fechamento (1–31), Cor (paleta de 6 cores)
- `src/components/cards/CardsTab.tsx` — orquestra: grid/lista de `CardVisual`, botão "Adicionar cartão", e ao clicar num cartão abre um detalhe (drawer ou seção expandida) com:
  - Lista de transações filtradas por `card_id` (reusa `TransactionTable`)
  - Mini-dashboard: total gasto no mês, gráfico de pizza por categoria daquele cartão (reusa lógica do Recharts já em uso)

**Bancos suportados (estilo + cor padrão):**
Nubank (roxo #8A05BE), Itaú (laranja #EC7000), Bradesco (vermelho #CC092F), Santander (vermelho #EC0000), Inter (laranja #FF7A00), C6 (preto #000000), Banco do Brasil (amarelo #FAE128), Caixa (azul #005CA9), Outro (cinza)

**Bandeiras suportadas:** Visa, Mastercard, Elo, Amex, Hipercard

### Alterações em `SpreadsheetsPage.tsx`
- `TabsList` passa de 3 → 4 colunas, novo trigger "Cartões" com ícone `CreditCard`
- Nova `TabsContent value="cards"` renderizando `<CardsTab />`
- Passar `cards` para o formulário de Nova Transação para permitir vincular `card_id`

### Detalhes técnicos
- Sem uso de imagens externas — todos os logos como componentes SVG locais para evitar dependências e problemas de licença
- Cor do cartão segue o banco escolhido por padrão, mas usuário pode trocar
- Cálculo "fatura aberta" simples: soma das transações com `card_id = X` no ciclo atual (entre fechamento anterior e próximo) — exibido no detalhe do cartão
- Gráfico de gastos do cartão: pizza por categoria (Recharts, já no projeto)
- Mobile-first: grid de 1 coluna em mobile, 2 em telas maiores

