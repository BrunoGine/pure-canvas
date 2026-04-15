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
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6",
  "#06B6D4", "#F97316", "#14B8A6", "#E11D48", "#7C3AED",
];

const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const CHART_OPTIONS = ["bar", "area", "line", "radar", "radialBar", "pie"];

function getChartType(_cat: string, index: number) {
  return CHART_OPTIONS[index % CHART_OPTIONS.length];
}

const GlassTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-4 py-3 shadow-lg border border-border/20"
      style={{
        background: "hsl(var(--card) / 0.75)",
        backdropFilter: "blur(12px)",
      }}>
      {label && <p className="text-xs font-semibold text-foreground mb-1.5">{label}</p>}
      {payload.map((p: any) => (
        <p key={p.dataKey || p.name} className="text-xs" style={{ color: p.color || p.payload?.fill }}>
          {p.name}: R$ {Number(p.value).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
        </p>
      ))}
    </div>
  );
};

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
          Entradas: Math.round(val.income * 100) / 100,
          Saídas: Math.round(val.expense * 100) / 100,
          Total: Math.round(val.total * 100) / 100,
        };
      });
  }, [transactions, selectedCat]);

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

  const commonGridProps = {
    strokeDasharray: "4 4",
    stroke: "hsl(var(--border))",
    strokeOpacity: 0.15,
    vertical: false as const,
  };
  const commonAxisTick = { fontSize: 10, fill: "hsl(var(--muted-foreground))" };

  const renderCategoryChart = () => {
    if (!selectedCat || categoryMonthly.length === 0) return null;

    switch (chartType) {
      case "bar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={categoryMonthly} barCategoryGap="20%">
              <defs>
                <linearGradient id="gradCatDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0.5} />
                </linearGradient>
                <linearGradient id="gradCatReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey="name" tick={commonAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={commonAxisTick} tickFormatter={v => `R$${v}`} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ fill: "hsl(var(--muted) / 0.2)" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Bar dataKey="Saídas" fill="url(#gradCatDespesas)" radius={[6, 6, 0, 0]} />
              <Bar dataKey="Entradas" fill="url(#gradCatReceitas)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        );

      case "area":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={categoryMonthly}>
              <defs>
                <linearGradient id="gradAreaDespesas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--destructive))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--destructive))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gradAreaReceitas" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey="name" tick={commonAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={commonAxisTick} tickFormatter={v => `R$${v}`} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }} />
              <Area type="monotone" dataKey="Saídas" stroke="hsl(var(--destructive))" fill="url(#gradAreaDespesas)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--destructive))" }} />
              <Area type="monotone" dataKey="Entradas" stroke="hsl(var(--primary))" fill="url(#gradAreaReceitas)" strokeWidth={2.5} dot={{ r: 3, fill: "hsl(var(--primary))" }} />
            </AreaChart>
          </ResponsiveContainer>
        );

      case "line":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={categoryMonthly}>
              <CartesianGrid {...commonGridProps} />
              <XAxis dataKey="name" tick={commonAxisTick} axisLine={false} tickLine={false} />
              <YAxis tick={commonAxisTick} tickFormatter={v => `R$${v}`} axisLine={false} tickLine={false} />
              <Tooltip content={<GlassTooltip />} cursor={{ stroke: "hsl(var(--muted-foreground))", strokeDasharray: "4 4" }} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
              <Line type="monotone" dataKey="Saídas" stroke="hsl(var(--destructive))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--destructive))", strokeWidth: 2, stroke: "hsl(var(--card))" }} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Entradas" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4, fill: "hsl(var(--primary))", strokeWidth: 2, stroke: "hsl(var(--card))" }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        );

      case "radar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={subBreakdown.length > 0 ? subBreakdown : [{ name: "—", value: 0 }]}>
              <PolarGrid stroke="hsl(var(--border))" strokeOpacity={0.2} />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip content={<GlassTooltip />} />
              <Radar dataKey="value" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.25} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        );

      case "radialBar":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart innerRadius="20%" outerRadius="90%" data={subBreakdown.slice(0, 5)} startAngle={180} endAngle={0}>
              <RadialBar dataKey="value" background={{ fill: "hsl(var(--muted) / 0.15)" }} cornerRadius={6} label={{ position: "insideStart", fill: "hsl(var(--foreground))", fontSize: 10 }} />
              <Tooltip content={<GlassTooltip />} />
              <Legend iconSize={10} formatter={(_value: string, entry: any) => entry?.payload?.name} />
            </RadialBarChart>
          </ResponsiveContainer>
        );

      case "pie":
        return (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={subBreakdown} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={4} strokeWidth={0}>
                {subBreakdown.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<GlassTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
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

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight={600}>
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
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
              <SelectItem value="expense">Saídas</SelectItem>
              <SelectItem value="income">Entradas</SelectItem>
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
                    paddingAngle={4}
                    strokeWidth={0}
                    cursor="pointer"
                    labelLine={false}
                    label={renderCustomLabel}
                    onClick={(_, index) => {
                      const cat = data[index]?.name;
                      setSelectedCat(selectedCat === cat ? null : cat);
                    }}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
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
                  <Tooltip content={<GlassTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
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
