export const paymentMethods = [
  { value: "pix", label: "Pix" },
  { value: "credito", label: "Crédito" },
  { value: "debito", label: "Débito" },
  { value: "dinheiro", label: "Dinheiro (à vista)" },
  { value: "boleto", label: "Boleto" },
  { value: "transferencia", label: "Transferência" },
] as const;

export type PaymentMethod = (typeof paymentMethods)[number]["value"];

export const paymentMethodLabel = (value?: string | null): string => {
  if (!value) return "—";
  return paymentMethods.find((p) => p.value === value)?.label ?? value;
};
