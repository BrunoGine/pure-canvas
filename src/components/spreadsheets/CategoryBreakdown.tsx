import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--destructive))",
  "#F59E0B",
  "#10B981",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
  "#6366F1",
  "#14B8A6",
];

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

const CategoryBreakdown = ({ transactions }: Props) => {
  const [filterType, setFilterType] = useState<"all" | "income" | "expense">("expense");

  const data = useMemo(() => {
    const filtered = filterType === "all"
      ? transactions
      : transactions.filter(t => t.type === filterType);

    const grouped: Record<string, number> = {};
    filtered.forEach(t => {
      const cat = t.category || "Sem categoria";
      grouped[cat] = (grouped[cat] || 0) + Math.abs(Number(t.amount));
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, filterType]);

  const total = data.reduce((s, d) => s + d.value, 0);

  if (transactions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Adicione transações para ver a análise por categoria.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold">Gastos por Categoria</h3>
          <Select value={filterType} onValueChange={(v: "all" | "income" | "expense") => setFilterType(v)}>
            <SelectTrigger className="w-[130px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="expense">Despesas</SelectItem>
              <SelectItem value="income">Receitas</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {data.length > 0 ? (
          <>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    paddingAngle={2}
                  >
                    {data.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) =>
                      `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                    }
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {data.map((item, i) => (
                <div key={item.name} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold">
                      R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs text-muted-foreground ml-1">
                      ({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <p className="text-center text-muted-foreground text-sm py-4">
            Nenhuma transação encontrada para este filtro.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryBreakdown;
