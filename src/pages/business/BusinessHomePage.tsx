import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, TrendingUp, TrendingDown, Wallet, Receipt, FileText, Plus, ArrowUpRight, ArrowDownLeft, BarChart3 } from "lucide-react";
import { format, parseISO, subMonths, startOfMonth, endOfMonth } from "date-fns";
import { ptBR } from "date-fns/locale";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { useCompany } from "@/contexts/CompanyContext";
import { useTransactions } from "@/hooks/useTransactions";
import GoalsSection from "@/components/goals/GoalsSection";
import { useSubscription } from "@/hooks/useSubscription";
import EnterprisePromo from "@/components/billing/EnterprisePromo";

const BusinessHomePage = () => {
  const navigate = useNavigate();
  const { activeCompany, companies, loading } = useCompany();
  const { transactions } = useTransactions();
  const { can, loading: subLoading } = useSubscription();
  const [hide, setHide] = useState(false);


  const now = new Date();
  const month = now.getMonth();
  const year = now.getFullYear();

  const { revenue, expenses, profit, txCount } = useMemo(() => {
    let inc = 0, exp = 0, count = 0;
    for (const t of transactions) {
      const d = parseISO(t.date);
      if (d.getMonth() !== month || d.getFullYear() !== year) continue;
      count++;
      if (t.type === "income") inc += Math.abs(t.amount);
      else exp += Math.abs(t.amount);
    }
    return { revenue: inc, expenses: exp, profit: inc - exp, txCount: count };
  }, [transactions, month, year]);

  const chartData = useMemo(() => {
    const months: { label: string; receita: number; despesa: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const ref = subMonths(now, i);
      const start = startOfMonth(ref);
      const end = endOfMonth(ref);
      let r = 0, e = 0;
      for (const t of transactions) {
        const d = parseISO(t.date);
        if (d < start || d > end) continue;
        if (t.type === "income") r += Math.abs(t.amount);
        else e += Math.abs(t.amount);
      }
      months.push({ label: format(ref, "MMM", { locale: ptBR }), receita: r, despesa: e });
    }
    return months;
  }, [transactions]);

  const recent = useMemo(() => transactions.slice(0, 5), [transactions]);

  const fmt = (v: number) => hide ? "••••" : v.toLocaleString("pt-BR", { minimumFractionDigits: 2 });

  // Guards (after hooks)
  if (!loading && companies.length === 0) {
    return <Navigate to="/empresa/onboarding" replace />;
  }
  if (!loading && !activeCompany) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 size={14} className="text-[hsl(var(--business-primary))]" />
            <p className="text-muted-foreground text-sm">{activeCompany?.segment || "Modo Empresa"}</p>
          </div>
          <h1 className="font-display text-2xl font-bold">{activeCompany?.name}</h1>
        </div>
        <button
          type="button"
          onClick={() => setHide((v) => !v)}
          className="mt-1 px-3 h-9 text-xs rounded-xl bg-[hsl(var(--business-primary)/0.1)] hover:bg-[hsl(var(--business-primary)/0.2)] border border-[hsl(var(--business-primary)/0.25)] text-[hsl(var(--business-primary))] transition-colors"
        >
          {hide ? "Mostrar" : "Ocultar"}
        </button>
      </motion.div>

      {/* KPIs */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="grid grid-cols-2 gap-3">
        <KpiCard icon={ArrowUpRight} label="Faturamento" value={`R$ ${fmt(revenue)}`} accent="positive" />
        <KpiCard icon={ArrowDownLeft} label="Despesas" value={`R$ ${fmt(expenses)}`} accent="negative" />
        <KpiCard icon={Wallet} label="Lucro estimado" value={`R$ ${fmt(profit)}`} accent={profit >= 0 ? "positive" : "negative"} highlight />
        <KpiCard icon={Receipt} label="Movimentações" value={hide ? "••" : String(txCount)} accent="neutral" />
      </motion.div>

      {/* Chart */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} className="business-card rounded-2xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <BarChart3 size={16} className="text-[hsl(var(--business-primary))]" />
          <h2 className="text-sm font-semibold">Últimos 6 meses</h2>
        </div>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 4, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => v >= 1000 ? `${(v/1000).toFixed(0)}k` : v} />
              <Tooltip
                contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
              />
              <Bar dataKey="receita" fill="hsl(var(--business-primary))" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.section>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3">
        <ActionButton icon={Plus} label="Lançar transação" onClick={() => navigate("/planilhas")} />
        <ActionButton icon={FileText} label="Balanço Patrimonial" onClick={() => navigate("/planilhas")} />
      </div>

      {/* Goals */}
      <GoalsSection />

      {/* Recent transactions */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          {profit >= 0 ? <TrendingUp size={18} className="text-[hsl(var(--business-primary))]" /> : <TrendingDown size={18} className="text-destructive" />}
          Fluxo recente
        </h2>
        <div className="glass-card rounded-xl overflow-hidden">
          {recent.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">
              Nenhuma movimentação ainda. Lance entradas e saídas em Planilhas.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {recent.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-4 py-3.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`rounded-xl p-2 ${tx.type === "income" ? "bg-[hsl(var(--business-primary)/0.15)] border border-[hsl(var(--business-primary)/0.25)]" : "bg-destructive/10 border border-destructive/20"}`}>
                      {tx.type === "income" ? (
                        <ArrowUpRight size={14} className="text-[hsl(var(--business-primary))]" />
                      ) : (
                        <ArrowDownLeft size={14} className="text-destructive" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">{format(parseISO(tx.date), "dd 'de' MMM", { locale: ptBR })} · {tx.category}</p>
                    </div>
                  </div>
                  <span className={`text-sm font-bold tabular-nums shrink-0 ${tx.type === "income" ? "text-[hsl(var(--business-primary))]" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}R$ {Math.abs(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.section>
    </div>
  );
};

const KpiCard = ({ icon: Icon, label, value, accent, highlight }: { icon: any; label: string; value: string; accent: "positive" | "negative" | "neutral"; highlight?: boolean }) => {
  const color =
    accent === "positive" ? "text-[hsl(var(--business-primary))]"
    : accent === "negative" ? "text-destructive"
    : "text-foreground";
  return (
    <div className={`business-card rounded-2xl p-4 ${highlight ? "ring-1 ring-[hsl(var(--business-primary)/0.3)]" : ""}`}>
      <div className="flex items-center gap-1.5 mb-1">
        <Icon size={12} className="text-muted-foreground" />
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      </div>
      <p className={`text-xl font-display font-bold tabular-nums ${color}`}>{value}</p>
    </div>
  );
};

const ActionButton = ({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) => (
  <button
    onClick={onClick}
    className="business-card rounded-2xl p-4 flex items-center gap-3 hover:bg-[hsl(var(--business-primary)/0.05)] transition-colors text-left"
  >
    <div className="w-9 h-9 rounded-xl bg-[hsl(var(--business-primary))] text-white flex items-center justify-center">
      <Icon size={16} />
    </div>
    <span className="text-xs font-semibold">{label}</span>
  </button>
);

export default BusinessHomePage;
