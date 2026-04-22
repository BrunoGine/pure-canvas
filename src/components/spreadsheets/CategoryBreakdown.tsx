import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { paymentMethods } from "@/lib/paymentMethods";

const COLORS = [
  "#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6",
  "#06B6D4", "#F97316", "#14B8A6", "#E11D48", "#7C3AED",
];

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
  payment_method?: string | null;
}

interface Props {
  transactions: Transaction[];
}

type MethodFilter = "all" | string;

const CategoryBreakdown = ({ transactions }: Props) => {
  const [filterType, setFilterType] = useState<"income" | "expense">("expense");
  const [methodFilter, setMethodFilter] = useState<MethodFilter>("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedCategory(null);
  }, [filterType, methodFilter]);

  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      if (!cardRef.current) return;
      if (!cardRef.current.contains(e.target as Node)) {
        setSelectedCategory(null);
      }
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, []);

  useEffect(() => {
    if (selectedCategory && itemRefs.current[selectedCategory]) {
      itemRefs.current[selectedCategory]?.scrollIntoView({ block: "nearest", behavior: "auto" });
    }
  }, [selectedCategory]);

  const toggleCategory = (name: string) => {
    setSelectedCategory(prev => (prev === name ? null : name));
  };

  const data = useMemo(() => {
    const filtered = transactions.filter(t => {
      if (t.type !== filterType) return false;
      if (methodFilter === "all") return true;
      return t.payment_method === methodFilter;
    });

    const grouped: Record<string, number> = {};
    filtered.forEach(t => {
      const cat = t.category || "Sem categoria";
      grouped[cat] = (grouped[cat] || 0) + Math.abs(Number(t.amount));
    });

    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, filterType, methodFilter]);

  const total = data.reduce((s, d) => s + d.value, 0);
  const selectedIndex = selectedCategory ? data.findIndex(d => d.name === selectedCategory) : -1;

  if (transactions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-6 text-center text-muted-foreground text-sm">
          Adicione transações para ver a análise por categoria.
        </CardContent>
      </Card>
    );
  }

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, payload }: any) => {
    if (percent < 0.01) return null;
    const sliceName = name || payload?.name;
    const handleLabelClick = (e: any) => {
      e.stopPropagation?.();
      if (sliceName) toggleCategory(sliceName);
    };
    const RADIAN = Math.PI / 180;
    if (percent < 0.03) {
      const radius = outerRadius + 12;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);
      return (
        <text
          x={x}
          y={y}
          fill="hsl(var(--foreground))"
          textAnchor={x > cx ? "start" : "end"}
          dominantBaseline="central"
          fontSize={10}
          fontWeight={600}
          onClick={handleLabelClick}
          style={{ cursor: "pointer", pointerEvents: "all" }}
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      );
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={11}
        fontWeight={600}
        onClick={handleLabelClick}
        style={{ cursor: "pointer", pointerEvents: "all" }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card ref={cardRef} className="shadow-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <h3 className="text-sm font-semibold">Gráfico de Categorias</h3>
          <div className="flex items-center gap-2">
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
            <Select value={filterType} onValueChange={(v: "income" | "expense") => setFilterType(v)}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expense">Saídas</SelectItem>
                <SelectItem value="income">Entradas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {data.length > 0 ? (
          <>
            {/* Overview pie */}
            <div
              className="h-[220px] outline-none [&_*]:outline-none [&_path]:outline-none [&_path:focus]:outline-none"
              onClick={(e) => e.stopPropagation()}
            >
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
                    strokeWidth={0}
                    labelLine={false}
                    label={renderCustomLabel}
                    isAnimationActive={false}
                    className="cursor-pointer focus:outline-none"
                    activeIndex={selectedIndex >= 0 ? selectedIndex : undefined}
                    activeShape={(props: any) => (
                      <Sector {...props} outerRadius={props.outerRadius + 6} stroke="none" />
                    )}
                    onClick={(d: any) => {
                      if (d?.name) toggleCategory(d.name);
                    }}
                  >
                    {data.map((entry, i) => {
                      const dimmed = selectedCategory && selectedCategory !== entry.name;
                      return (
                        <Cell
                          key={entry.name}
                          fill={COLORS[i % COLORS.length]}
                          fillOpacity={dimmed ? 0.35 : 1}
                          stroke="none"
                          style={{ outline: "none" }}
                        />
                      );
                    })}
                  </Pie>
                  <Tooltip content={<GlassTooltip />} isAnimationActive={false} />
                  <Legend
                    wrapperStyle={{ fontSize: 11 }}
                    iconType="circle"
                    iconSize={8}
                    onClick={() => {}}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Category list */}
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {data.map((item, i) => {
                const isSelected = selectedCategory === item.name;
                const dimmed = selectedCategory && !isSelected;
                return (
                  <button
                    key={item.name}
                    ref={(el) => (itemRefs.current[item.name] = el)}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCategory(item.name);
                    }}
                    className={`flex items-center justify-between text-sm w-full p-1.5 rounded-lg transition-all text-left ${
                      isSelected
                        ? "bg-secondary ring-1 ring-primary/40"
                        : "hover:bg-secondary/50"
                    } ${dimmed ? "opacity-50" : "opacity-100"}`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <span className="font-semibold">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                      <span className="text-xs text-muted-foreground ml-1">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
                    </div>
                  </button>
                );
              })}
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
