# Saldo atual: ignorar transações no Crédito

## Problema
Hoje o Saldo atual da Home soma todas as `income` e subtrai todas as `expense`, incluindo despesas pagas no cartão de crédito — que ainda não saíram da conta. Isso distorce o saldo disponível.

## Solução
No cálculo do `balance` em `src/pages/HomePage.tsx`, ignorar transações cujo `payment_method === "credito"`.

- `income`: continua somando todas as entradas (entradas raramente têm payment_method "credito", mas mesmo assim ficam fora se for o caso, para coerência).
- `expenses`: passa a somar apenas despesas onde `payment_method !== "credito"`.
- `balance = income - expenses` (com a nova regra).

A lista "Transações recentes" e a página de Planilhas continuam mostrando as transações de crédito normalmente — só o card de Saldo atual deixa de descontá-las.

## Alteração técnica

Em `src/pages/HomePage.tsx`, ajustar o `useMemo`:

```ts
const { income, expenses, balance } = useMemo(() => {
  const isCredit = (t: Transaction) => t.payment_method === "credito";
  const inc = transactions
    .filter((t) => t.type === "income" && !isCredit(t))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  const exp = transactions
    .filter((t) => t.type === "expense" && !isCredit(t))
    .reduce((s, t) => s + Math.abs(t.amount), 0);
  return { income: inc, expenses: exp, balance: inc - exp };
}, [transactions]);
```

Nenhuma alteração de banco, hook ou outros componentes é necessária.
