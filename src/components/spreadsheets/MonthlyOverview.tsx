import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { paymentMethods } from "@/lib/paymentMethods";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: string;
  payment_method?: string | null;
}

interface Props {
  transactions: Transaction[];
}

type MethodFilter = "all" | string;

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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

const MonthlyOverview = ({ transactions }: Props) => {
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");

  const data = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    const filtered = transactions.filter(t => {
      if (methodFilter === "all") return true;
      return t.payment_method === methodFilter;
    });

    filtered.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0 };
      const amt = Math.abs(Number(t.amount));
      if (t.type === "income") grouped[key].income += amt;
      else grouped[key].expense += amt;
    });

    return Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([key, val]) => {
        const [year, month] = key.split("-");
        return {
          name: `${MONTHS[parseInt(month) - 1]}/${year.slice(2)}`,
          Entradas: Math.round(val.income * 100) / 100,
          Saídas: Math.round(val.expense * 100) / 100,
          Saldo: Math.round((val.income - val.expense) * 100) / 100,
        };
      });
  }, [transactions, methodFilter]);

  if (transactions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Adicione transações para ver o resumo mensal.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">Resumo Mensal</h3>
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

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} barCategoryGap="20%">
              <defs>
                <linearGradient id="gradReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                </linearGradient>
                <linearGradient id="gradDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.6} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.15} vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
              <Legend
                wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                iconType="circle"
                iconSize={8}
              />
              <Bar
                dataKey="Entradas"
                fill="url(#gradReceitas)"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "hsl(var(--primary))", opacity: 0.9 }}
              />
              <Bar
                dataKey="Saídas"
                fill="url(#gradDespesas)"
                radius={[6, 6, 0, 0]}
                activeBar={{ fill: "hsl(var(--destructive))", opacity: 0.9 }}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Mês</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Entradas</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Saídas</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(row => (
                <tr key={row.name}>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-right text-primary">
                    R$ {row.Entradas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right text-destructive">
                    R$ {row.Saídas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className={`px-3 py-2 text-right font-semibold ${row.Saldo >= 0 ? "text-primary" : "text-destructive"}`}>
                    R$ {row.Saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MonthlyOverview;
