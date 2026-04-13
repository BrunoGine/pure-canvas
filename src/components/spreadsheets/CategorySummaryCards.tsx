import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Minus, Receipt, Calculator, Hash } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: string;
}

interface CategorySummaryCardsProps {
  transactions: Transaction[];
  selectedCategory: string;
}

const CategorySummaryCards = ({ transactions, selectedCategory }: CategorySummaryCardsProps) => {
  const stats = useMemo(() => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const catTxs = transactions.filter(t => t.category === selectedCategory);

    const thisMonthTxs = catTxs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const prevMonthTxs = catTxs.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === prevMonth && d.getFullYear() === prevYear;
    });

    const thisExpense = thisMonthTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
    const prevExpense = prevMonthTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);

    const count = thisMonthTxs.length;
    const avg = count > 0 ? thisExpense / count : 0;
    const variation = prevExpense > 0 ? ((thisExpense - prevExpense) / prevExpense) * 100 : null;

    return { thisExpense, count, avg, variation };
  }, [transactions, selectedCategory]);

  const formatCurrency = (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  const VariationIcon = stats.variation === null ? Minus : stats.variation > 0 ? TrendingUp : TrendingDown;
  const variationColor = stats.variation === null ? "text-muted-foreground" : stats.variation > 0 ? "text-destructive" : "text-primary";

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <Card className="shadow-card">
        <CardContent className="p-3 text-center space-y-1">
          <Receipt size={16} className="mx-auto text-primary" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total do Mês</p>
          <p className="text-sm font-bold tabular-nums">{formatCurrency(stats.thisExpense)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-3 text-center space-y-1">
          <Hash size={16} className="mx-auto text-primary" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transações</p>
          <p className="text-sm font-bold tabular-nums">{stats.count}</p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-3 text-center space-y-1">
          <Calculator size={16} className="mx-auto text-primary" />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Média</p>
          <p className="text-sm font-bold tabular-nums">{formatCurrency(stats.avg)}</p>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardContent className="p-3 text-center space-y-1">
          <VariationIcon size={16} className={`mx-auto ${variationColor}`} />
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">vs. Mês Anterior</p>
          <p className={`text-sm font-bold tabular-nums ${variationColor}`}>
            {stats.variation === null ? "—" : `${stats.variation > 0 ? "+" : ""}${stats.variation.toFixed(1)}%`}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default CategorySummaryCards;
