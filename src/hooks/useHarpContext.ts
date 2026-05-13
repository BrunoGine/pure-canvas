import { useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useBudgets } from "@/hooks/useBudgets";
import { useGoals } from "@/hooks/useGoals";

export interface HarpContext {
  mode: "personal" | "business";
  company?: { name: string; segment?: string | null; business_type?: string | null };
  kpis: {
    revenueMonth: number;
    expensesMonth: number;
    balanceMonth: number;
    savingsRate: number; // 0-100
    revenuePrev: number;
    expensesPrev: number;
    balanceVsPrevPct: number; // +/- % vs mês anterior
  };
  topCategories: Array<{ category: string; amount: number; changePct: number }>; // top 5 expense
  alerts: string[]; // pré-calculados (ex.: "Delivery cresceu 23%")
  budgets: Array<{ category: string; limit: number; spent: number; pct: number; over: boolean }>;
  goals: Array<{ name: string; current: number; target: number; pct: number }>;
  hasData: boolean;
}

const ym = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

export function useHarpContext(): HarpContext {
  const { mode, activeCompany } = useCompany();
  const { transactions } = useTransactions();
  const { budgets } = useBudgets();
  const { goals } = useGoals();

  return useMemo(() => {
    const now = new Date();
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const ymNow = ym(now);
    const ymPrev = ym(prev);

    const monthTx = transactions.filter((t) => t.date.startsWith(ymNow));
    const prevTx = transactions.filter((t) => t.date.startsWith(ymPrev));

    const sum = (arr: typeof transactions, type: "income" | "expense") =>
      arr.filter((t) => t.type === type).reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    const revenueMonth = sum(monthTx, "income");
    const expensesMonth = sum(monthTx, "expense");
    const balanceMonth = revenueMonth - expensesMonth;
    const revenuePrev = sum(prevTx, "income");
    const expensesPrev = sum(prevTx, "expense");
    const balancePrev = revenuePrev - expensesPrev;
    const savingsRate = revenueMonth > 0 ? Math.round((balanceMonth / revenueMonth) * 100) : 0;
    const balanceVsPrevPct =
      balancePrev !== 0 ? Math.round(((balanceMonth - balancePrev) / Math.abs(balancePrev)) * 100) : 0;

    // Top categorias (despesa) com variação
    const groupExpense = (rows: typeof transactions) => {
      const m = new Map<string, number>();
      rows.filter((t) => t.type === "expense").forEach((t) => {
        m.set(t.category, (m.get(t.category) || 0) + Math.abs(Number(t.amount)));
      });
      return m;
    };
    const curMap = groupExpense(monthTx);
    const prevMap = groupExpense(prevTx);
    const topCategories = [...curMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([category, amount]) => {
        const p = prevMap.get(category) || 0;
        const changePct = p > 0 ? Math.round(((amount - p) / p) * 100) : amount > 0 ? 100 : 0;
        return { category, amount: Math.round(amount), changePct };
      });

    // Alertas
    const alerts: string[] = [];
    topCategories.forEach((c) => {
      if (c.changePct >= 25 && c.amount >= 50) {
        alerts.push(`${c.category} cresceu ${c.changePct}% vs mês anterior`);
      }
    });
    if (savingsRate < 0) alerts.push("Despesas superam receitas neste mês");

    const budgetsPayload = budgets.slice(0, 8).map((b) => {
      const spent = Math.round(
        monthTx
          .filter((t) => t.type === "expense" && t.category === b.category)
          .reduce((s, t) => s + Math.abs(Number(t.amount)), 0),
      );
      const limit = Number(b.limit_amount);
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      const over = spent > limit;
      if (over) alerts.push(`Orçamento de ${b.category} estourado (${pct}%)`);
      return { category: b.category, limit, spent, pct, over };
    });

    const goalsPayload = goals.slice(0, 6).map((g) => {
      const target = Number(g.target_amount);
      const current = Number(g.current_amount);
      return {
        name: g.name,
        current: Math.round(current),
        target: Math.round(target),
        pct: target > 0 ? Math.round((current / target) * 100) : 0,
      };
    });

    const isBusiness = mode === "business" && !!activeCompany;
    const hasData = transactions.length > 0 || budgets.length > 0 || goals.length > 0;

    return {
      mode: isBusiness ? "business" : "personal",
      company: isBusiness
        ? {
            name: activeCompany!.name,
            segment: activeCompany!.segment,
            business_type: activeCompany!.business_type,
          }
        : undefined,
      kpis: {
        revenueMonth: Math.round(revenueMonth),
        expensesMonth: Math.round(expensesMonth),
        balanceMonth: Math.round(balanceMonth),
        savingsRate,
        revenuePrev: Math.round(revenuePrev),
        expensesPrev: Math.round(expensesPrev),
        balanceVsPrevPct,
      },
      topCategories,
      alerts: alerts.slice(0, 5),
      budgets: budgetsPayload,
      goals: goalsPayload,
      hasData,
    };
  }, [mode, activeCompany, transactions, budgets, goals]);
}
