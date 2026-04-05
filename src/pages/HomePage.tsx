import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, Wallet, Plus, ArrowUpRight, ArrowDownLeft, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const HomePage = () => {
  const { user } = useAuth();
  const [userName, setUserName] = useState("Usuário");

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (data?.display_name) setUserName(data.display_name);
        else if (user.user_metadata?.display_name) setUserName(user.user_metadata.display_name);
      });
  }, [user]);

  const balance = 12450.80;
  const income = 8500;
  const expenses = 4230.50;

  const goals = [
    { name: "Reserva de emergência", current: 8000, target: 15000 },
    { name: "Viagem", current: 3200, target: 5000 },
    { name: "Investimentos", current: 12000, target: 50000 },
  ];

  const recentTransactions = [
    { name: "Salário", amount: 8500, type: "income" as const, date: "28 Mar" },
    { name: "Aluguel", amount: -1800, type: "expense" as const, date: "27 Mar" },
    { name: "Mercado", amount: -450, type: "expense" as const, date: "26 Mar" },
    { name: "Freelance", amount: 1200, type: "income" as const, date: "25 Mar" },
  ];

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={14} className="text-primary" />
          <p className="text-muted-foreground text-sm">Olá, {userName} 👋</p>
        </div>
        <h1 className="font-display text-2xl font-bold">Seu Resumo</h1>
      </motion.div>

      {/* Balance Card — Liquid Glass */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative rounded-2xl overflow-hidden">
          {/* Background gradient */}
          <div className="absolute inset-0 gradient-primary opacity-95" />
          {/* Glass highlight overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
          {/* Inner glow at top */}
          <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />

          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                <Wallet size={16} className="text-white" />
              </div>
              <p className="text-white/70 text-sm font-medium">Saldo Atual</p>
            </div>
            <p className="text-white text-3xl font-display font-bold mt-2 glow-text">
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex gap-6 mt-5">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2 border border-white/10">
                  <ArrowUpRight size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">Receitas</p>
                  <p className="text-white text-sm font-semibold">
                    R$ {income.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-white/15 backdrop-blur-sm p-2 border border-white/10">
                  <ArrowDownLeft size={14} className="text-white" />
                </div>
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">Despesas</p>
                  <p className="text-white text-sm font-semibold">
                    R$ {expenses.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          {/* Bottom reflection */}
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      </motion.div>

      {/* Goals */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Target size={18} className="text-primary" /> Metas
          </h2>
          <button className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all">
            <Plus size={14} /> Nova
          </button>
        </div>
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.05 }}
            >
              <div className="glass-card rounded-xl p-4 hover:glow-border transition-all duration-300">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{goal.name}</span>
                  <span className="text-xs font-semibold text-primary">
                    {Math.round((goal.current / goal.target) * 100)}%
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-2 mb-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R$ {goal.current.toLocaleString("pt-BR")}</span>
                  <span>R$ {goal.target.toLocaleString("pt-BR")}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* Recent Transactions */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          {income > expenses ? <TrendingUp size={18} className="text-primary" /> : <TrendingDown size={18} className="text-destructive" />}
          Transações Recentes
        </h2>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border/50">
            {recentTransactions.map((tx, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.35 + i * 0.05 }}
                className="flex items-center justify-between px-4 py-3.5 hover:bg-primary/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl p-2 ${tx.type === "income" ? "bg-primary/10 border border-primary/20" : "bg-destructive/10 border border-destructive/20"}`}>
                    {tx.type === "income" ? (
                      <ArrowUpRight size={14} className="text-primary" />
                    ) : (
                      <ArrowDownLeft size={14} className="text-destructive" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{tx.name}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </div>
                </div>
                <span className={`text-sm font-bold tabular-nums ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : ""}R$ {Math.abs(tx.amount).toLocaleString("pt-BR")}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
