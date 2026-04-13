import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

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
  const [selectedCat, setSelectedCat] = useState<string | null>(null);

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

  // Monthly trend for a specific category
  const categoryTrend = useMemo(() => {
    if (!selectedCat) return [];
    const filtered = transactions.filter(t => (t.category || "Sem categoria") === selectedCat);
    const grouped: Record<string, { income: number; expense: number }> = {};

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
      .slice(-6)
      .map(([key, val]) => {
        const [year, month] = key.split("-");
        return {
          name: `${MONTHS[parseInt(month) - 1]}/${year.slice(2)}`,
          Receitas: Math.round(val.income * 100) / 100,
          Despesas: Math.round(val.expense * 100) / 100,
        };
      });
  }, [transactions, selectedCat]);

  // Top transactions for selected category
  const topTransactions = useMemo(() => {
    if (!selectedCat) return [];
    return transactions
      .filter(t => (t.category || "Sem categoria") === selectedCat)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
      .slice(0, 5);
  }, [transactions, selectedCat]);

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
          <Select value={filterType} onValueChange={(v: "all" | "income" | "expense") => { setFilterType(v); setSelectedCat(null); }}>
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
                    cursor="pointer"
                    onClick={(_, index) => {
                      const cat = data[index]?.name;
                      setSelectedCat(selectedCat === cat ? null : cat);
                    }}
                  >
                    {data.map((entry, i) => (
                      <Cell
                        key={i}
                        fill={COLORS[i % COLORS.length]}
                        opacity={selectedCat && selectedCat !== entry.name ? 0.3 : 1}
                        stroke={selectedCat === entry.name ? "hsl(var(--foreground))" : "none"}
                        strokeWidth={selectedCat === entry.name ? 2 : 0}
                      />
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

            {/* Category list */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {data.map((item, i) => (
                <button
                  key={item.name}
                  onClick={() => setSelectedCat(selectedCat === item.name ? null : item.name)}
                  className={`flex items-center justify-between text-sm w-full p-1.5 rounded-lg transition-all ${
                    selectedCat === item.name ? "bg-primary/10 ring-1 ring-primary/30" : "hover:bg-secondary/50"
                  }`}
                >
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
                </button>
              ))}
            </div>

            {/* Detailed view when category is selected */}
            {selectedCat && (
              <div className="space-y-4 pt-2 border-t border-border/50">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Detalhes — {selectedCat}
                </h4>

                <Tabs defaultValue="trend" className="w-full">
                  <TabsList className="h-8">
                    <TabsTrigger value="trend" className="text-xs h-6">Tendência</TabsTrigger>
                    <TabsTrigger value="top" className="text-xs h-6">Maiores</TabsTrigger>
                  </TabsList>

                  <TabsContent value="trend">
                    {categoryTrend.length > 0 ? (
                      <div className="h-[180px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={categoryTrend}>
                            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                            <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
                            <Tooltip
                              formatter={(value: number) =>
                                `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`
                              }
                            />
                            <Area type="monotone" dataKey="Despesas" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.15} strokeWidth={2} />
                            <Area type="monotone" dataKey="Receitas" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center py-4">Sem dados suficientes.</p>
                    )}
                  </TabsContent>

                  <TabsContent value="top">
                    <div className="space-y-2">
                      {topTransactions.map((tx, i) => (
                        <div key={tx.id} className="flex items-center justify-between text-sm p-2 rounded-lg bg-secondary/20">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                            <div>
                              <p className="font-medium text-xs">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground">{tx.date}</p>
                            </div>
                          </div>
                          <span className={`font-semibold text-xs ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                            {tx.type === "income" ? "+" : "-"}R$ {Math.abs(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      ))}
                      {topTransactions.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4">Nenhuma transação.</p>
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}
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
