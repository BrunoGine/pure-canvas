import { useMemo } from "react";
import { useCompany } from "@/contexts/CompanyContext";
import { useTransactions } from "@/hooks/useTransactions";
import { useGoals } from "@/hooks/useGoals";
import { useBudgets } from "@/hooks/useBudgets";
import { buildBalanceSheet } from "@/lib/balanceSheet";

export interface BusinessContextPayload {
  company: {
    name: string;
    segment: string | null;
    business_type: string | null;
    monthly_revenue: number | null;
    employees_count: number | null;
    main_goal: string | null;
  };
  kpis: {
    revenueMonth: number;
    expensesMonth: number;
    profitMonth: number;
    revenue6m: number;
    expenses6m: number;
  };
  cashFlow: {
    balance: number;
    lastTransactions: Array<{
      date: string;
      description: string;
      amount: number;
      type: "income" | "expense";
      category: string;
    }>;
  };
  balanceSheet: { assets: number; liabilities: number; equity: number };
  goals: Array<{ name: string; target: number; current: number; deadline: string | null }>;
  budgets: Array<{ category: string; limit: number; spent: number }>;
}

export function useBusinessContext(): BusinessContextPayload | null {
  const { mode, activeCompany } = useCompany();
  const { transactions } = useTransactions();
  const { goals } = useGoals();
  const { budgets } = useBudgets();

  return useMemo(() => {
    if (mode !== "business" || !activeCompany) return null;

    const now = new Date();
    const ymNow = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    const monthTx = transactions.filter((t) => t.date.startsWith(ymNow));
    const revenueMonth = monthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const expensesMonth = monthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    const sixMonthTx = transactions.filter((t) => new Date(t.date) >= sixMonthsAgo);
    const revenue6m = sixMonthTx
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const expenses6m = sixMonthTx
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);

    const balance = transactions.reduce(
      (s, t) => s + (t.type === "income" ? 1 : -1) * Math.abs(Number(t.amount)),
      0,
    );

    const lastTransactions = transactions.slice(0, 10).map((t) => ({
      date: t.date,
      description: t.description.slice(0, 60),
      amount: Number(t.amount),
      type: t.type,
      category: t.category,
    }));

    const bs = buildBalanceSheet(
      transactions.map((t) => ({
        amount: Number(t.amount),
        type: t.type,
        category: t.category,
        date: t.date,
      })),
      now.getFullYear(),
    );

    const goalsPayload = goals.slice(0, 10).map((g) => ({
      name: g.name,
      target: Number(g.target_amount),
      current: Number(g.current_amount),
      deadline: g.deadline,
    }));

    const budgetsPayload = budgets.slice(0, 10).map((b) => {
      const spent = monthTx
        .filter((t) => t.type === "expense" && t.category === b.category)
        .reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
      return { category: b.category, limit: Number(b.limit_amount), spent };
    });

    return {
      company: {
        name: activeCompany.name,
        segment: activeCompany.segment,
        business_type: activeCompany.business_type,
        monthly_revenue: activeCompany.monthly_revenue,
        employees_count: activeCompany.employees_count,
        main_goal: activeCompany.main_goal,
      },
      kpis: {
        revenueMonth,
        expensesMonth,
        profitMonth: revenueMonth - expensesMonth,
        revenue6m,
        expenses6m,
      },
      cashFlow: { balance, lastTransactions },
      balanceSheet: {
        assets: bs.totals.ativo,
        liabilities: bs.totals.passivo,
        equity: bs.totals.patrimonio,
      },
      goals: goalsPayload,
      budgets: budgetsPayload,
    };
  }, [mode, activeCompany, transactions, goals, budgets]);
}
