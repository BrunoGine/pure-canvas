import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { paymentMethods } from "@/lib/paymentMethods";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: string;
  category: string;
  date: string;
  payment_method?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactions: Transaction[];
  categories: string[];
}

type MethodFilter = "all" | string;

const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg border border-border/20"
      style={{
        background: "hsl(var(--card) / 0.75)",
        backdropFilter: "blur(12px)",
      }}>
      <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} className="text-xs" style={{ color: p.color }}>
          {p.name}: R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

const CategorySpendingDialog = ({ open, onOpenChange, transactions, categories }: Props) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");

  const methodFiltered = useMemo(
    () =>
      transactions.filter(t => {
        if (methodFilter === "all") return true;
        return t.payment_method === methodFilter;
      }),
    [transactions, methodFilter]
  );

  const categoryData = useMemo(() => {
    if (!selected) return null;
    const filtered = methodFiltered.filter(t => t.category === selected);
    const totalIncome = filtered.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = filtered.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);

    const months: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = { income: 0, expense: 0 };
    }
    filtered.forEach(t => {
      const key = t.date.substring(0, 7);
      if (months[key]) {
        if (t.type === "income") months[key].income += t.amount;
        else months[key].expense += Math.abs(t.amount);
      }
    });
    const chartData = Object.entries(months).map(([k, v]) => {
      const [, m] = k.split("-");
      const names = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
      return { month: names[parseInt(m) - 1], receitas: v.income, despesas: v.expense };
    });

    const top = [...filtered].sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount)).slice(0, 5);

    return { totalIncome, totalExpense, chartData, top };
  }, [selected, methodFiltered]);

  const handleClose = (v: boolean) => {
    if (!v) setSelected(null);
    onOpenChange(v);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="glass-card border-border/30 max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {selected && (
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setSelected(null)}>
                <ArrowLeft size={16} />
              </Button>
            )}
            {selected ? selected : "Categoria do gasto"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex items-center justify-end pb-2">
          <Select value={methodFilter} onValueChange={(v: MethodFilter) => setMethodFilter(v)}>
            <SelectTrigger className="w-[160px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {paymentMethods.map(pm => (
                <SelectItem key={pm.value} value={pm.value}>{pm.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!selected ? (
          <div className="grid grid-cols-2 gap-2">
            {categories.map(cat => {
              const count = methodFiltered.filter(t => t.category === cat).length;
              return (
                <button
                  key={cat}
                  onClick={() => setSelected(cat)}
                  className="p-3 rounded-xl bg-secondary/30 border border-border/30 hover:border-primary/50 hover:shadow-glow transition-all text-left"
                >
                  <p className="text-sm font-medium">{cat}</p>
                  <p className="text-xs text-muted-foreground">{count} transações</p>
                </button>
              );
            })}
            {categories.length === 0 && (
              <p className="col-span-2 text-sm text-muted-foreground text-center py-6">Nenhuma categoria disponível.</p>
            )}
          </div>
        ) : categoryData && (
          <div className="space-y-4">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="glass-card rounded-xl p-3 text-center">
                <TrendingUp size={16} className="mx-auto text-primary mb-1" />
                <p className="text-xs text-muted-foreground">Entradas</p>
                <p className="text-base font-bold text-primary tabular-nums">
                  R$ {categoryData.totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="glass-card rounded-xl p-3 text-center">
                <TrendingDown size={16} className="mx-auto text-destructive mb-1" />
                <p className="text-xs text-muted-foreground">Saídas</p>
                <p className="text-base font-bold text-destructive tabular-nums">
                  R$ {categoryData.totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* Chart */}
            <div className="glass-card rounded-xl p-4">
              <p className="text-xs font-semibold text-muted-foreground mb-3">Entradas vs Saídas (6 meses)</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={categoryData.chartData} barCategoryGap="20%">
                  <defs>
                    <linearGradient id="gradReceitasDialog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                    </linearGradient>
                    <linearGradient id="gradDespesasDialog" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                      <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.15} vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                  <Tooltip content={<GlassTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} iconType="circle" iconSize={8} />
                  <Bar dataKey="receitas" name="Entradas" fill="url(#gradReceitasDialog)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="despesas" name="Saídas" fill="url(#gradDespesasDialog)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Top transactions */}
            {categoryData.top.length > 0 && (
              <div className="glass-card rounded-xl p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Receipt size={13} /> Maiores transações
                </p>
                {categoryData.top.map(t => (
                  <div key={t.id} className="flex items-center justify-between py-1.5 border-b border-border/20 last:border-0">
                    <div>
                      <p className="text-sm">{t.description}</p>
                      <p className="text-xs text-muted-foreground">{t.date}</p>
                    </div>
                    <p className={`text-sm font-semibold tabular-nums ${t.type === "income" ? "text-primary" : "text-destructive"}`}>
                      {t.type === "income" ? "+" : "-"}R$ {Math.abs(t.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CategorySpendingDialog;
