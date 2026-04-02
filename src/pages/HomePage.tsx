import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Target, Wallet, Plus, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
      .eq("user_id", user.id)
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
        <p className="text-muted-foreground text-sm">Olá, {userName} 👋</p>
        <h1 className="font-display text-2xl font-bold">Seu Resumo</h1>
      </motion.div>

      {/* Balance Card */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="gradient-primary border-0 shadow-elevated overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-1">
              <Wallet size={16} className="text-primary-foreground/70" />
              <p className="text-primary-foreground/70 text-sm font-medium">Saldo Atual</p>
            </div>
            <p className="text-primary-foreground text-3xl font-display font-bold">
              R$ {balance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <div className="flex gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary-foreground/20 p-1.5">
                  <ArrowUpRight size={14} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-[10px]">Receitas</p>
                  <p className="text-primary-foreground text-sm font-semibold">
                    R$ {income.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-primary-foreground/20 p-1.5">
                  <ArrowDownLeft size={14} className="text-primary-foreground" />
                </div>
                <div>
                  <p className="text-primary-foreground/60 text-[10px]">Despesas</p>
                  <p className="text-primary-foreground text-sm font-semibold">
                    R$ {expenses.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Goals */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <Target size={18} className="text-primary" /> Metas
          </h2>
          <button className="text-primary text-xs font-medium flex items-center gap-1">
            <Plus size={14} /> Nova
          </button>
        </div>
        <div className="space-y-3">
          {goals.map((goal, i) => (
            <Card key={i} className="shadow-card">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">{goal.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {Math.round((goal.current / goal.target) * 100)}%
                  </span>
                </div>
                <Progress value={(goal.current / goal.target) * 100} className="h-2 mb-1.5" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>R$ {goal.current.toLocaleString("pt-BR")}</span>
                  <span>R$ {goal.target.toLocaleString("pt-BR")}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.section>

      {/* Recent Transactions */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          {income > expenses ? <TrendingUp size={18} className="text-primary" /> : <TrendingDown size={18} className="text-destructive" />}
          Transações Recentes
        </h2>
        <Card className="shadow-card">
          <CardContent className="p-0 divide-y divide-border">
            {recentTransactions.map((tx, i) => (
              <div key={i} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${tx.type === "income" ? "bg-primary/10" : "bg-destructive/10"}`}>
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
                <span className={`text-sm font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : ""}R$ {Math.abs(tx.amount).toLocaleString("pt-BR")}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </motion.section>
    </div>
  );
};

export default HomePage;
