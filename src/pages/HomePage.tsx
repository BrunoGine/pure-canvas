import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Wallet, ArrowUpRight, ArrowDownLeft, Sparkles, StickyNote, ShieldCheck } from "lucide-react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";
import GoalsSection from "@/components/goals/GoalsSection";
import SharedGoalsSection from "@/components/goals/SharedGoalsSection";

const HomePage = () => {
  const { user } = useAuth();
  const { transactions } = useTransactions();
  const { recurringTransactions } = useRecurringTransactions();
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

  const { income, expenses, balance } = useMemo(() => {
    const isCredit = (t: typeof transactions[number]) => t.payment_method === "credito";
    const inc = transactions
      .filter((t) => t.type === "income" && !isCredit(t))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    const exp = transactions
      .filter((t) => t.type === "expense" && !isCredit(t))
      .reduce((s, t) => s + Math.abs(t.amount), 0);
    return { income: inc, expenses: exp, balance: inc - exp };
  }, [transactions]);

  const { creditInvoices, recurringPending, availableBalance } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const monthStart = new Date(y, m, 1);

    const invoices = transactions
      .filter((t) => t.type === "expense" && t.payment_method === "credito")
      .filter((t) => {
        const d = parseISO(t.date);
        return d.getFullYear() === y && d.getMonth() === m;
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);

    const recPending = recurringTransactions
      .filter((r) => r.active && r.type === "expense")
      .filter((r) => {
        if (!r.last_executed_at) return true;
        return parseISO(r.last_executed_at) < monthStart;
      })
      .reduce((s, r) => s + Math.abs(r.amount), 0);

    return {
      creditInvoices: invoices,
      recurringPending: recPending,
      availableBalance: balance - invoices - recPending,
    };
  }, [transactions, recurringTransactions, balance]);

  const recentTransactions = useMemo(
    () =>
      transactions.slice(0, 6).map((t) => ({
        name: t.description,
        amount: t.amount,
        type: t.type,
        date: format(parseISO(t.date), "dd 'de' MMM", { locale: ptBR }),
        notes: t.notes,
      })),
    [transactions]
  );

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

      {/* Balance Cards — Liquid Glass */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Saldo Atual */}
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
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
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">Entradas</p>
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
                  <p className="text-white/50 text-[10px] uppercase tracking-wider">Saídas</p>
                  <p className="text-white text-sm font-semibold">
                    R$ {expenses.toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
        </div>

        {/* Saldo Disponível para Uso */}
        <div className="relative rounded-2xl overflow-hidden glass-card border border-border/60">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10" />
          <div className="absolute top-0 left-0 right-0 h-px bg-foreground/10" />

          <div className="relative p-6">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-xl bg-primary/15 flex items-center justify-center border border-primary/20">
                <ShieldCheck size={16} className="text-primary" />
              </div>
              <p className="text-muted-foreground text-sm font-medium">Disponível para Uso</p>
            </div>
            <p className={`text-3xl font-display font-bold mt-2 ${availableBalance < 0 ? "text-destructive" : "text-foreground"}`}>
              R$ {availableBalance.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
            <p className="text-[11px] text-muted-foreground mt-1">
              Saldo após reservar faturas e recorrências do mês
            </p>
            <div className="flex flex-col gap-1.5 mt-4 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Faturas do crédito</span>
                <span className="font-semibold tabular-nums">
                  − R$ {creditInvoices.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Recorrências pendentes</span>
                <span className="font-semibold tabular-nums">
                  − R$ {recurringPending.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Goals */}
      <GoalsSection />

      {/* Shared Goals (Vaquinhas) */}
      <SharedGoalsSection />

      {/* Recent Transactions */}
      <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}>
        <h2 className="font-display text-lg font-semibold mb-3 flex items-center gap-2">
          {income > expenses ? <TrendingUp size={18} className="text-primary" /> : <TrendingDown size={18} className="text-destructive" />}
          Transações Recentes
        </h2>
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="divide-y divide-border/50">
            {recentTransactions.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                Nenhuma transação ainda. Adicione na aba Planilhas.
              </div>
            ) : (
              recentTransactions.map((tx, i) => (
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
                  <div className="flex items-center gap-2">
                    {tx.notes && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                            <StickyNote size={18} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="max-w-[220px] p-3">
                          <p className="text-xs">{tx.notes}</p>
                        </PopoverContent>
                      </Popover>
                    )}
                    <span className={`text-sm font-bold tabular-nums ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}R$ {Math.abs(tx.amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.section>
    </div>
  );
};

export default HomePage;
