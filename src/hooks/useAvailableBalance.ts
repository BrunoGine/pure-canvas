import { useMemo } from "react";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import { useCreditCards } from "@/hooks/useCreditCards";
import { computeAvailableBalance, type AvailableBalanceBreakdown } from "@/lib/availableBalance";

export interface UseAvailableBalanceResult extends AvailableBalanceBreakdown {
  loading: boolean;
}

export function useAvailableBalance(): UseAvailableBalanceResult {
  const { transactions, loading: loadingTx } = useTransactions();
  const { recurringTransactions, loading: loadingRec } = useRecurringTransactions();
  const { cards, loading: loadingCards } = useCreditCards();

  const breakdown = useMemo(
    () => computeAvailableBalance(transactions, recurringTransactions, cards),
    [transactions, recurringTransactions, cards],
  );

  return { ...breakdown, loading: loadingTx || loadingRec || loadingCards };
}
