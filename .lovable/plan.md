# Plano: Sistema de Metas Financeiras

Funcionalidade para o usuário criar metas (viagem, compra, presente etc.), guardar dinheiro nelas, contribuir manual ou recorrentemente, retirar e celebrar quando concluir.

## 1. Banco de dados (migration)

Criar tabela `goals`:

| Coluna | Tipo | Notas |
|---|---|---|
| id | uuid PK | default gen_random_uuid() |
| user_id | uuid NOT NULL | RLS por user |
| name | text NOT NULL | |
| target_amount | numeric NOT NULL | > 0 |
| current_amount | numeric NOT NULL | default 0, >= 0 |
| deadline | date NULL | |
| image_url | text NULL | imagem da meta |
| is_completed | boolean NOT NULL | default false |
| completed_at | timestamptz NULL | |
| created_at / updated_at | timestamptz | default now() |

Estender `recurring_transactions` com colunas opcionais:
- `goal_id uuid NULL` — quando preenchido, a recorrência é uma contribuição automática à meta.

Estender `manual_transactions`:
- `goal_id uuid NULL` — vincula a transação à meta de origem (contribuição/retirada/cancelamento).

RLS em `goals`: políticas SELECT/INSERT/UPDATE/DELETE apenas para `auth.uid() = user_id` (mesmo padrão das outras tabelas).

Validação via **trigger** (não CHECK) garantindo:
- `target_amount > 0`
- `current_amount >= 0`
- ao atingir target, marcar `is_completed=true` e `completed_at=now()`.

Adicionar categoria padrão "Meta" no app (apenas string, não precisa migration).

## 2. Edge function de recorrência

Atualizar `process-recurring-transactions/index.ts`:
- ao processar uma recorrência com `goal_id`, além de criar a transação (saída, categoria "Meta"), incrementar `goals.current_amount` e disparar verificação de conclusão.

## 3. Edge function nova: `suggest-goal-amount`

- Recebe `{ name, deadline? }`.
- Chama Lovable AI Gateway (modelo `google/gemini-2.5-flash`) com prompt curto pedindo valor estimado em BRL para o objetivo descrito + breve justificativa.
- Retorna `{ amount: number, rationale: string }`.
- JWT obrigatório (mesmo padrão de `harp-ia-chat`). Sem chamadas em cascata — somente sob demanda do botão "Me ajude a definir o valor".

## 4. Imagem da meta (sem custo)

- Buscar imagem livre via Unsplash Source (`https://source.unsplash.com/600x400/?<keywords>`) usando o nome da meta como query (sem API key, gratuito).
- Permitir o usuário colar URL própria ou trocar a sugestão.
- Persistir em `image_url`.

## 5. Frontend

### 5.1 Hook `src/hooks/useGoals.ts`
CRUD + ações:
- `addGoal({ name, target_amount, deadline?, image_url? })`
- `contributeToGoal(goal, amount, { recurring?: { day_of_month, amount } })`
  - cria `manual_transactions` (type=`expense`, category=`Meta`, description=`Contribuição: <nome>`, `goal_id`)
  - atualiza `current_amount`
  - se `recurring`, cria entrada em `recurring_transactions` com `goal_id`
  - dispara conclusão se atingir target
- `withdrawFromGoal(goal, amount)`
  - `manual_transactions` (type=`income`, category=`Meta`, descrição=`Retirada da meta: <nome>`)
  - subtrai do `current_amount` (nunca abaixo de 0)
- `deleteGoal(goal)`
  - cria transação `income` no valor `current_amount` (se > 0), categoria `Meta`, descrição `Cancelamento da meta: <nome>`
  - apaga a meta e suas recorrências vinculadas

Validações: nunca aceitar valores ≤ 0, retirada nunca maior que `current_amount`, mostrar `toast` em erro.

### 5.2 Componentes em `src/components/goals/`
- `GoalsSection.tsx` — seção da Home com header "🎯 Minhas Metas" + botão "Nova".
- `GoalCard.tsx` — card "liquid glass": imagem ao topo, nome, `R$ atual / R$ alvo`, barra de progresso, %, ações (Adicionar / Retirar / Excluir via menu).
- `GoalFormDialog.tsx` — criar meta: nome, valor objetivo, prazo (opcional), preview da imagem (Unsplash), botão "Me ajude a definir o valor" (chama edge function, mostra sugestão com aceitar/recusar).
- `GoalContributeDialog.tsx` — valor + switch "Tornar recorrente" + (se ligado) dia do mês.
- `GoalWithdrawDialog.tsx` — valor a retirar.
- `GoalCompletedDialog.tsx` — modal de parabéns + animação de confete.

Confete: usar `canvas-confetti` (leve, ~3KB).

### 5.3 Integração na Home
Em `src/pages/HomePage.tsx`, substituir a seção `Metas` atual (que está vazia/placeholder) pela nova `<GoalsSection />`. Manter o estilo/animação existente.

### 5.4 Conclusão
Quando `current_amount >= target_amount`:
- update `is_completed=true, completed_at=now()`
- abrir `GoalCompletedDialog` com confete
- desativar recorrências vinculadas (`active=false`).

## 6. Design

- Estilo já existente no app: `glass-card`, `gradient-primary`, `shadow-glow`, `Progress` com gradiente.
- Cards arredondados (`rounded-2xl`), imagem 16:9 no topo, overlay sutil.
- Botões claros: "Adicionar valor" (primary), "Retirar" (outline), "Excluir" (ghost destrutivo num menu).
- Acessibilidade: labels, foco visível, mensagens de erro claras em PT-BR.

## 7. Segurança / regras

- Validação Zod nos dialogs (números > 0, nome 1–80 chars, deadline futura opcional).
- RLS em `goals` + `goal_id` checado pelas policies existentes em `manual_transactions`/`recurring_transactions` (já restringem por user_id).
- Sem CHECK constraints baseadas em tempo; usar trigger.
- Nenhuma chamada de IA automática — apenas no clique do botão de sugestão.
- Imagens via Unsplash Source (sem chave, sem custo). Fallback para placeholder se falhar.

## 8. Arquivos a criar/editar

**Novos**
- `supabase/functions/suggest-goal-amount/index.ts`
- `src/hooks/useGoals.ts`
- `src/components/goals/GoalsSection.tsx`
- `src/components/goals/GoalCard.tsx`
- `src/components/goals/GoalFormDialog.tsx`
- `src/components/goals/GoalContributeDialog.tsx`
- `src/components/goals/GoalWithdrawDialog.tsx`
- `src/components/goals/GoalCompletedDialog.tsx`

**Editados**
- `src/pages/HomePage.tsx` (substituir seção Metas)
- `supabase/functions/process-recurring-transactions/index.ts` (suporte a `goal_id`)
- migration SQL (tabela `goals` + colunas `goal_id` + trigger + RLS)
- `package.json` (`canvas-confetti`)

## 9. Pós-implementação

- Avisar que o usuário precisa estar autenticado (já está).
- Lembrar que recorrências dependem do cron já existente que invoca `process-recurring-transactions`.
