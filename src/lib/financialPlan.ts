// Pure financial plan generator (no AI). Adapted 50/30/20 with profile tweaks.

export type FinancialGoal = "save" | "debt" | "invest" | "control" | "organize";
export type TracksExpenses = "yes" | "sometimes" | "no";

export interface FinancialAnswers {
  monthly_income: number;
  financial_goal: FinancialGoal;
  tracks_expenses: TracksExpenses;
  has_emergency_fund: boolean;
}

export interface PlanCategory {
  key: "essentials" | "leisure" | "goals" | "emergency" | "investments" | "debt";
  label: string;
  percent: number; // 0-100
  amount: number; // R$
}

export interface FinancialPlan {
  income: number;
  categories: PlanCategory[];
}

const LABELS: Record<PlanCategory["key"], string> = {
  essentials: "Gastos essenciais",
  leisure: "Lazer",
  goals: "Metas",
  emergency: "Reserva de emergência",
  investments: "Investimentos",
  debt: "Quitação de dívidas",
};

export function generateFinancialPlan(a: FinancialAnswers): FinancialPlan {
  const income = Math.max(0, Number(a.monthly_income) || 0);

  // Base 50/30/20: 50 essenciais, 30 lazer, 10 metas, 5 reserva, 5 investimentos
  let pct: Record<PlanCategory["key"], number> = {
    essentials: 50,
    leisure: 25,
    goals: 10,
    emergency: 8,
    investments: 7,
    debt: 0,
  };

  // Renda baixa: prioriza essenciais
  if (income > 0 && income < 1500) {
    pct = { essentials: 65, leisure: 10, goals: 8, emergency: 12, investments: 5, debt: 0 };
  } else if (income < 3000) {
    pct = { essentials: 55, leisure: 20, goals: 10, emergency: 10, investments: 5, debt: 0 };
  }

  // Sem reserva → reforça reserva
  if (!a.has_emergency_fund) {
    const boost = Math.min(10, pct.leisure - 5);
    pct.emergency += boost;
    pct.leisure -= boost;
  }

  // Objetivo
  switch (a.financial_goal) {
    case "debt": {
      const take = 25;
      pct.debt = take;
      pct.investments = 0;
      pct.leisure = Math.max(5, pct.leisure - 10);
      pct.goals = Math.max(5, pct.goals - 5);
      break;
    }
    case "invest":
      pct.investments = Math.max(pct.investments, 20);
      pct.leisure = Math.max(10, pct.leisure - 8);
      break;
    case "save":
      pct.goals += 5;
      pct.leisure = Math.max(10, pct.leisure - 5);
      break;
    case "control":
      pct.essentials += 0; // mantém base
      break;
    case "organize":
      break;
  }

  // Normalize to exactly 100
  const keys = Object.keys(pct) as PlanCategory["key"][];
  const sum = keys.reduce((s, k) => s + pct[k], 0);
  if (sum !== 100 && sum > 0) {
    const factor = 100 / sum;
    keys.forEach((k) => (pct[k] = Math.round(pct[k] * factor)));
    // adjust rounding diff
    const diff = 100 - keys.reduce((s, k) => s + pct[k], 0);
    pct.essentials += diff;
  }

  const categories: PlanCategory[] = keys
    .filter((k) => pct[k] > 0)
    .map((k) => ({
      key: k,
      label: LABELS[k],
      percent: pct[k],
      amount: Math.round(((income * pct[k]) / 100) * 100) / 100,
    }));

  return { income, categories };
}

export const GOAL_LABELS: Record<FinancialGoal, string> = {
  save: "Guardar dinheiro",
  debt: "Sair das dívidas",
  invest: "Começar a investir",
  control: "Controlar gastos",
  organize: "Organizar minha vida financeira",
};

export const TRACKS_LABELS: Record<TracksExpenses, string> = {
  yes: "Sim, sempre",
  sometimes: "Às vezes",
  no: "Não controlo",
};

export const INCOME_PRESETS = [
  { label: "Até R$ 1.000", value: 1000 },
  { label: "R$ 1.000 – 3.000", value: 2000 },
  { label: "R$ 3.000 – 5.000", value: 4000 },
  { label: "R$ 5.000 – 10.000", value: 7500 },
  { label: "Mais de R$ 10.000", value: 12000 },
];
