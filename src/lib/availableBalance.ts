import { parseISO } from "date-fns";
import type { Transaction } from "@/hooks/useTransactions";
import type { RecurringTransaction } from "@/hooks/useRecurringTransactions";
import type { CreditCard } from "@/hooks/useCreditCards";
import { getInvoiceCycles } from "@/lib/invoice";

export interface AvailableBalanceBreakdown {
  /** Saldo realizado = entradas − saídas, EXCLUINDO compras no crédito (ainda não saíram da conta) */
  balance: number;
  income: number;
  expenses: number;
  /** Total a pagar nas próximas faturas (ciclo fechado + ciclo aberto por cartão, baseado em closing_day) */
  openInvoices: number;
  /** Recorrências ativas ainda não executadas neste mês — expense subtrai, income soma */
  recurringPendingExpense: number;
  recurringPendingIncome: number;
  /** Disponível para uso */
  available: number;
}

const stripTime = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/**
 * Calcula o saldo disponível para uso, considerando compromissos já assumidos.
 *
 * Regras:
 * - Compras no crédito NÃO entram no saldo (só saem da conta quando a fatura é paga).
 * - Faturas abertas = ciclo já fechado (a vencer) + ciclo aberto acumulando, por cartão.
 *   Compras de crédito mais antigas que o ciclo fechado anterior são presumidas pagas.
 * - Recorrências pendentes deste mês: apenas se `last_executed_at` for anterior ao mês corrente
 *   (após o cron executar, o flag impede dupla contagem com a manual_transaction gerada).
 * - Metas NÃO são subtraídas porque a contribuição já gera uma manual_transaction de despesa.
 */
export function computeAvailableBalance(
  transactions: Transaction[],
  recurring: RecurringTransaction[],
  cards: CreditCard[],
  today: Date = new Date(),
): AvailableBalanceBreakdown {
  // 1) Saldo realizado (exclui crédito)
  const isCredit = (t: Transaction) => t.payment_method === "credito";
  const income = transactions
    .filter((t) => t.type === "income" && !isCredit(t))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const expenses = transactions
    .filter((t) => t.type === "expense" && !isCredit(t))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  const balance = income - expenses;

  // 2) Faturas abertas por cartão (current + next cycle)
  let openInvoices = 0;
  const cardMap = new Map(cards.map((c) => [c.id, c]));
  const creditTxs = transactions.filter((t) => t.type === "expense" && isCredit(t) && t.card_id);

  for (const card of cards) {
    const cycles = getInvoiceCycles(card.closing_day, today);
    const start = stripTime(cycles.currentCycleStart);
    const end = stripTime(cycles.nextCycleEnd);
    const total = creditTxs
      .filter((t) => t.card_id === card.id)
      .filter((t) => {
        const d = stripTime(parseISO(t.date));
        return d >= start && d <= end;
      })
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    openInvoices += total;
  }

  // Compras no crédito sem card_id ou com card removido — incluir como obrigação aberta
  const orphanCredit = creditTxs
    .filter((t) => !t.card_id || !cardMap.has(t.card_id))
    .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
  openInvoices += orphanCredit;

  // 3) Recorrências pendentes deste mês (não executadas ainda)
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const pendingThisMonth = (r: RecurringTransaction) => {
    if (!r.active) return false;
    if (!r.last_executed_at) return true;
    return parseISO(r.last_executed_at) < monthStart;
  };

  const recurringPendingExpense = recurring
    .filter((r) => r.type === "expense" && pendingThisMonth(r))
    .reduce((s, r) => s + Math.abs(Number(r.amount)), 0);

  const recurringPendingIncome = recurring
    .filter((r) => r.type === "income" && pendingThisMonth(r))
    .reduce((s, r) => s + Math.abs(Number(r.amount)), 0);

  const available =
    balance - openInvoices - recurringPendingExpense + recurringPendingIncome;

  return {
    balance,
    income,
    expenses,
    openInvoices: Math.round(openInvoices * 100) / 100,
    recurringPendingExpense: Math.round(recurringPendingExpense * 100) / 100,
    recurringPendingIncome: Math.round(recurringPendingIncome * 100) / 100,
    available: Math.round(available * 100) / 100,
  };
}
