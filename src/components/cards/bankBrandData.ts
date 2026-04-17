export interface BankOption {
  slug: string;
  name: string;
  color: string;
  textColor: string;
}

export const BANKS: BankOption[] = [
  { slug: "nubank", name: "Nubank", color: "#8A05BE", textColor: "#FFFFFF" },
  { slug: "itau", name: "Itaú", color: "#EC7000", textColor: "#FFFFFF" },
  { slug: "bradesco", name: "Bradesco", color: "#CC092F", textColor: "#FFFFFF" },
  { slug: "santander", name: "Santander", color: "#EC0000", textColor: "#FFFFFF" },
  { slug: "inter", name: "Inter", color: "#FF7A00", textColor: "#FFFFFF" },
  { slug: "c6", name: "C6 Bank", color: "#1A1A1A", textColor: "#FFD700" },
  { slug: "bb", name: "Banco do Brasil", color: "#FAE128", textColor: "#003B7A" },
  { slug: "caixa", name: "Caixa", color: "#005CA9", textColor: "#FFFFFF" },
  { slug: "outro", name: "Outro", color: "#374151", textColor: "#FFFFFF" },
];

export const BRANDS = [
  { slug: "visa", name: "Visa" },
  { slug: "mastercard", name: "Mastercard" },
  { slug: "elo", name: "Elo" },
  { slug: "amex", name: "American Express" },
  { slug: "hipercard", name: "Hipercard" },
];

export const CARD_COLORS = [
  "#8A05BE",
  "#EC7000",
  "#CC092F",
  "#1A1A1A",
  "#005CA9",
  "#10B981",
];

export const getBank = (slug: string) => BANKS.find((b) => b.slug === slug) || BANKS[BANKS.length - 1];
export const getBrand = (slug: string) => BRANDS.find((b) => b.slug === slug) || BRANDS[0];
