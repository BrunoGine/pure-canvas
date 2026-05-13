## Objetivo

Permitir dois tipos de meta:

1. **Meta com objetivo** (atual): valor total a alcançar, ex: "Viagem R$ 5.000".
2. **Meta mensal/hábito** (novo): sem valor objetivo total, apenas um valor a contribuir todo mês, ex: "Investir R$ 100/mês".

---

## 1. Banco de dados (migração)

Tabela `goals`:

- Tornar `target_amount` **nullable** (hoje é `NOT NULL`).
- Adicionar coluna `monthly_target_amount numeric` (nullable) — valor mensal desejado para metas-hábito.
- Adicionar coluna `goal_type text NOT NULL DEFAULT 'target'` com valores `'target'` (com objetivo) ou `'monthly'` (hábito mensal).

Atualizar a função `validate_goal()`:

- Para `goal_type = 'target'`: manter regra atual (exige `target_amount > 0`, marca `is_completed` quando `current_amount >= target_amount`).
- Para `goal_type = 'monthly'`: exigir `monthly_target_amount > 0`, **nunca** marcar como concluída automaticamente, ignorar `target_amount`.

---

## 2. Hook `useGoals.ts`

- Estender `Goal` com `monthly_target_amount: number | null` e `goal_type: 'target' | 'monthly'`.
- `NewGoalInput`: aceitar `goal_type`, `target_amount` opcional e `monthly_target_amount` opcional. Validar conforme o tipo.
- `addGoal`: gravar os novos campos. Para `monthly`, salvar `target_amount = null`.
- Em metas mensais, a contribuição não tem "fim" — não disparar `justCompleted`.

---

## 3. Formulário `GoalFormDialog.tsx`

- Adicionar um seletor no topo (2 abas/segmented):
  - **Com objetivo** (padrão) — fluxo atual.
  - **Meta mensal** — esconde "Valor objetivo" e "Me ajude a definir o valor"; mostra campo "Valor mensal (R$)" e mantém prazo opcional.
- Categoria/preset e nome continuam iguais para os dois tipos.
- Validação e `onCreate` adaptados ao tipo selecionado.

---

## 4. Card `GoalCard.tsx`

- **Meta com objetivo**: layout atual (progress bar, `current/target`, %).
- **Meta mensal**: substituir a barra de progresso por um indicador do mês corrente:
  - Calcular `contribuídoEsteMês` somando `manual_transactions` do mês atual com `goal_id = goal.id` e `category = 'Meta'` (entradas/saídas).
  - Mostrar `R$ X / R$ Y este mês` + barra do progresso mensal.
  - Badge "Mensal" no canto, sem estado "Concluída".
- Botões Adicionar/Retirar mantidos.

Para evitar N consultas, calcular o `contribuídoEsteMês` em `useGoals` (uma query agregada por meta mensal) e expor no objeto `Goal` em runtime (campo derivado `month_contributed`).

---

## 5. Diálogo de contribuição

- Para meta mensal, sugerir como valor padrão o `monthly_target_amount` restante do mês.
- Texto auxiliar: "Faltam R$ X para bater sua meta deste mês".
- Recorrência segue funcionando igual (já cria `recurring_transactions`).

---

## 6. Integração com Harp.IA / contexto

- `useHarpContext` passa a incluir resumo de metas mensais (quantas existem, total comprometido/mês, % batido no mês atual) para que a Harp possa comentar.

---

## Arquivos afetados

- `supabase/migrations/<nova>.sql` (schema + função)
- `src/hooks/useGoals.ts`
- `src/components/goals/GoalFormDialog.tsx`
- `src/components/goals/GoalCard.tsx`
- `src/components/goals/GoalContributeDialog.tsx`
- `src/hooks/useHarpContext.ts` (pequeno ajuste)

Sem alterações em `GoalsSection`, exceto que ele passa a renderizar os dois tipos no mesmo grid.