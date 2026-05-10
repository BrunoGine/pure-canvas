import { BUSINESS_GROUPS, BUSINESS_INCOME_CATEGORIES } from "./businessCategories";

export interface BSTransaction {
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string; // ISO yyyy-mm-dd
}

export interface BalanceSheet {
  year: number;
  totalRevenue: number;
  totalExpenses: number;
  result: number;
  expensesByCategory: { category: string; amount: number }[];
  revenueByCategory: { category: string; amount: number }[];
  ativoCirculante: { label: string; amount: number }[];
  ativoNaoCirculante: { label: string; amount: number }[];
  passivoCirculante: { label: string; amount: number }[];
  totals: { ativo: number; passivo: number; patrimonio: number };
}

const sumBy = <T>(arr: T[], pick: (t: T) => number) =>
  arr.reduce((s, x) => s + pick(x), 0);

export function buildBalanceSheet(
  transactions: BSTransaction[],
  year: number,
): BalanceSheet {
  const ofYear = transactions.filter((t) => t.date.startsWith(String(year)));

  const incomes = ofYear.filter((t) => t.type === "income");
  const expenses = ofYear.filter((t) => t.type === "expense");

  const totalRevenue = sumBy(incomes, (t) => Math.abs(Number(t.amount)));
  const totalExpenses = sumBy(expenses, (t) => Math.abs(Number(t.amount)));
  const result = totalRevenue - totalExpenses;

  const groupBy = (rows: BSTransaction[]) => {
    const map = new Map<string, number>();
    rows.forEach((r) => {
      map.set(r.category, (map.get(r.category) || 0) + Math.abs(Number(r.amount)));
    });
    return [...map.entries()]
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  };

  const expensesByCategory = groupBy(expenses);
  const revenueByCategory = groupBy(incomes);

  // Auto mapping (deterministic, no AI)
  const cashOnHand = Math.max(0, result);
  const ativoCirculante = [
    { label: "Caixa e Equivalentes", amount: cashOnHand },
    {
      label: "Receitas a Receber",
      amount: sumBy(
        incomes.filter((i) => i.category === "Recebimentos"),
        (i) => Math.abs(Number(i.amount)),
      ),
    },
  ];
  const ativoNaoCirculante = [
    {
      label: "Estoque",
      amount: sumBy(
        expenses.filter((e) => BUSINESS_GROUPS.inventory.includes(e.category as (typeof BUSINESS_GROUPS.inventory)[number])),
        (e) => Math.abs(Number(e.amount)),
      ),
    },
  ];

  const passivoCirculante = BUSINESS_GROUPS.liabilities.map((cat) => ({
    label: cat,
    amount: sumBy(
      expenses.filter((e) => e.category === cat),
      (e) => Math.abs(Number(e.amount)),
    ),
  }));

  const ativo =
    sumBy(ativoCirculante, (a) => a.amount) +
    sumBy(ativoNaoCirculante, (a) => a.amount);
  const passivo = sumBy(passivoCirculante, (p) => p.amount);
  const patrimonio = ativo - passivo;

  return {
    year,
    totalRevenue,
    totalExpenses,
    result,
    expensesByCategory,
    revenueByCategory,
    ativoCirculante,
    ativoNaoCirculante,
    passivoCirculante,
    totals: { ativo, passivo, patrimonio },
  };
}

export const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export { BUSINESS_INCOME_CATEGORIES };
