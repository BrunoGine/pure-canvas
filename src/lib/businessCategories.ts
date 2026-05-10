export const BUSINESS_INCOME_CATEGORIES = [
  "Vendas",
  "Serviços",
  "Recebimentos",
];

export const BUSINESS_EXPENSE_CATEGORIES = [
  "Fornecedor",
  "Estoque",
  "Impostos",
  "Funcionários",
  "Marketing",
  "Aluguel",
  "Transporte",
  "Outros",
];

export const BUSINESS_CATEGORIES = [
  ...BUSINESS_INCOME_CATEGORIES,
  ...BUSINESS_EXPENSE_CATEGORIES,
];

export const BUSINESS_GROUPS = {
  incomes: BUSINESS_INCOME_CATEGORIES,
  liabilities: ["Fornecedor", "Impostos", "Funcionários", "Aluguel"],
  operating: ["Marketing", "Transporte"],
  inventory: ["Estoque"],
} as const;
