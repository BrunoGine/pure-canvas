import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: string;
}

interface Props {
  transactions: Transaction[];
}

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const MonthlyOverview = ({ transactions }: Props) => {
  const data = useMemo(() => {
    const grouped: Record<string, { income: number; expense: number }> = {};

    transactions.forEach(t => {
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
          Receitas: Math.round(val.income * 100) / 100,
          Despesas: Math.round(val.expense * 100) / 100,
          Saldo: Math.round((val.income - val.expense) * 100) / 100,
        };
      });
  }, [transactions]);

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
        <h3 className="text-sm font-semibold">Resumo Mensal</h3>

        <div className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: number) =>
                  `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                }
              />
              <Legend />
              <Bar dataKey="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-3 py-2 text-left text-xs font-semibold text-muted-foreground">Mês</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Receitas</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Despesas</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-muted-foreground">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.map(row => (
                <tr key={row.name}>
                  <td className="px-3 py-2 font-medium">{row.name}</td>
                  <td className="px-3 py-2 text-right text-primary">
                    R$ {row.Receitas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="px-3 py-2 text-right text-destructive">
                    R$ {row.Despesas.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
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
