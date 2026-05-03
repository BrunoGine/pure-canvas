# Saldo disponível para uso

## Objetivo
Adicionar um segundo card ao lado do "Saldo Atual" mostrando quanto sobra após reservar o que ainda precisa ser pago: faturas de cartão de crédito e transações recorrentes do mês.

## Fórmula

```
Saldo disponível = Saldo Atual
                 − Faturas em aberto (despesas no crédito do mês corrente)
                 − Recorrências pendentes (recorrências expense ativas ainda não executadas neste mês)
```

Detalhes:
- **Faturas em aberto**: soma de `manual_transactions` com `type="expense"` e `payment_method="credito"` cuja `date` está no mês corrente (essas não entram no Saldo Atual hoje, conforme a regra anterior).
- **Recorrências pendentes**: soma de `recurring_transactions` com `active=true` e `type="expense"` cuja `last_executed_at` é null ou anterior ao primeiro dia do mês corrente. Recorrências de `income` não entram (o foco é o que vai sair).

## Mudanças

**`src/pages/HomePage.tsx`**
- Importar `useRecurringTransactions`.
- Adicionar `useMemo` para `creditInvoices`, `recurringPending` e `availableBalance`.
- Reorganizar o bloco do Saldo Atual em um grid de 2 colunas (md+) com dois cards lado a lado:
  - Card 1 (atual, mantém visual gradient/glass): Saldo Atual.
  - Card 2 (novo, mesmo estilo glass mais sutil — `glass-card` com pequeno gradient secundário): Saldo Disponível para Uso, com ícone (`PiggyBank` ou `ShieldCheck`), valor grande, e duas linhas pequenas mostrando "Faturas: R$ X" e "Recorrentes: R$ Y" para o usuário entender o que foi descontado.
- Em mobile (sm), os dois cards ficam empilhados.

Nenhuma alteração de banco ou de hook. Sem novas dependências.
