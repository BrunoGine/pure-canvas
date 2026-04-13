import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
  LineChart, Line,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  RadialBarChart, RadialBar,
} from "recharts";
import { BarChart3 } from "lucide-react";

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

// Each category gets a unique chart type
const CHART_TYPES: Record<string, string> = {};
const CHART_OPTIONS = ["bar", "area", "line", "radar", "radialBar", "pie"];

function getChartType(cat: string, index: number) {
  return CHART_OPTIONS[index % CHART_OPTIONS.length];
}

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

  const categoryNames = useMemo(() => data.map(d => d.name), [data]);

  // Monthly data for the selected category
  const categoryMonthly = useMemo(() => {
    if (!selectedCat) return [];
    const filtered = transactions.filter(t => (t.category || "Sem categoria") === selectedCat);
    const grouped: Record<string, { income: number; expense: number; total: number }> = {};

    filtered.forEach(t => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!grouped[key]) grouped[key] = { income: 0, expense: 0, total: 0 };
      const amt = Math.abs(Number(t.amount));
      if (t.type === "income") grouped[key].income += amt;
      else grouped[key].expense += amt;
      grouped[key].total += amt;
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
          Total: Math.round(val.total * 100) / 100,
        };
      });
  }, [transactions, selectedCat]);

  // Sub-breakdown: top descriptions within selected category
  const subBreakdown = useMemo(() => {
    if (!selectedCat) return [];
    const filtered = transactions.filter(t => (t.category || "Sem categoria") === selectedCat);
    const grouped: Record<string, number> = {};
    filtered.forEach(t => {
      grouped[t.description] = (grouped[t.description] || 0) + Math.abs(Number(t.amount));
    });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100, fill: COLORS[0] }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)
      .map((item, i) => ({ ...item, fill: COLORS[i % COLORS.length] }));
  }, [transactions, selectedCat]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const catIndex = selectedCat ? categoryNames.indexOf(selectedCat) : 0;
  const chartType = selectedCat ? getChartType(selectedCat, catIndex) : "pie";

  const formatCurrency = (value: number) => `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;

  if (transactions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Adicione transações para ver a análise por categoria.
        </CardContent>
      </Card>
    );
  }

  const renderCategoryChart = () => {
    if (!selectedCat || categoryMonthly.length === 0) return null;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMonthly}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Bar dataKey="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={categoryMonthly}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Area type="monotone" dataKey="Despesas" stroke="hsl(var(--destructive))" fill="hsl(var(--destructive))" fillOpacity={0.2} strokeWidth={2} />
              <Area type="monotone" dataKey="Receitas" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryMonthly}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={v => `R$${v}`} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
              <Line type="monotone" dataKey="Despesas" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="Receitas" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={subBreakdown.length > 0 ? subBreakdown : [{ name: "—", value: 0 }]}>
              <PolarGrid className="opacity-30" />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 9 }} />
              <PolarRadiusAxis tick={{ fontSize: 9 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.3} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "radialBar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="20%" outerRadius="90%" data={subBreakdown.slice(0, 5)} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" background cornerRadius={6} label={{ position: "insideStart", fill: "hsl(var(--foreground))", fontSize: 10 }} />
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend iconSize={10} formatter={(value, entry: any) => entry?.payload?.name} />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={subBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                {subBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(v: number) => formatCurrency(v)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  };

  const chartLabel: Record<string, string> = {
    bar: "Barras",
    area: "Área",
    line: "Linhas",
    radar: "Radar",
    radialBar: "Radial",
    pie: "Pizza",
  };

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
            {/* Overview pie */}
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
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category selector chips */}
            <div>
              <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <BarChart3 size={12} /> Selecione uma categoria para ver seu gráfico:
              </p>
              <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex gap-1.5 pb-1">
                  {categoryNames.map((cat, i) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCat(selectedCat === cat ? null : cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                        selectedCat === cat
                          ? "gradient-primary text-white shadow-glow"
                          : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/30"
                      }`}
                    >
                      <span
                        className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: COLORS[i % COLORS.length] }}
                      />
                      {cat}
                    </button>
                  ))}
                </div>
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
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
                    <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <span className="font-semibold">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                    <span className="text-xs text-muted-foreground ml-1">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Selected category chart */}
            {selectedCat && (
              <div className="space-y-3 pt-3 border-t border-border/50">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    {selectedCat} — Gráfico {chartLabel[chartType] || chartType}
                  </h4>
                </div>

                <div className="h-[220px]">
                  {renderCategoryChart()}
                </div>

                {/* Top transactions */}
                {subBreakdown.length > 0 && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground">Maiores itens</p>
                    {subBreakdown.map((item, i) => (
                      <div key={item.name} className="flex items-center justify-between text-xs p-2 rounded-lg bg-secondary/20">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <span className="font-semibold">{formatCurrency(item.value)}</span>
                      </div>
                    ))}
                  </div>
                )}
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
