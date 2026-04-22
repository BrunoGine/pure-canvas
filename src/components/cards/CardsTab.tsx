import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, Trash2, CreditCard, Receipt } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Transaction } from "@/hooks/useTransactions";
import CardVisual from "./CardVisual";
import CardForm from "./CardForm";
import TransactionTable from "@/components/spreadsheets/TransactionTable";
import { computeCardInvoices, formatBRL, formatDateShort } from "@/lib/invoice";

interface Props {
  transactions: Transaction[];
  onRemoveTransaction: (id: string) => void;
}

const COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4", "#F97316", "#14B8A6"];

const CardsTab = ({ transactions, onRemoveTransaction }: Props) => {
  const { cards, addCard, removeCard } = useCreditCards();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryMethodFilter, setCategoryMethodFilter] = useState<"all" | "credito" | "debito">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const categoryCardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setSelectedCategory(null);
  }, [categoryMethodFilter, selectedId]);

  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      if (!categoryCardRef.current) return;
      if (!categoryCardRef.current.contains(e.target as Node)) {
        setSelectedCategory(null);
      }
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, []);

  const toggleCategory = (name: string) => {
    setSelectedCategory(prev => (prev === name ? null : name));
  };

  const selected = cards.find((c) => c.id === selectedId);

  const cardTxs = useMemo(
    () => (selected ? transactions.filter((t) => (t as any).card_id === selected.id) : []),
    [transactions, selected]
  );

  const monthTotal = useMemo(() => {
    const now = new Date();
    return cardTxs
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [cardTxs]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    cardTxs
      .filter((t) => t.type === "expense")
      .filter((t) => categoryMethodFilter === "all" || (t as any).payment_method === categoryMethodFilter)
      .forEach((t) => {
        const cat = t.category || "Sem categoria";
        grouped[cat] = (grouped[cat] || 0) + Math.abs(t.amount);
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [cardTxs, categoryMethodFilter]);

  const invoices = useMemo(
    () => (selected ? computeCardInvoices(transactions, selected.id, selected.closing_day) : null),
    [transactions, selected]
  );

  if (selected) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1">
            <ArrowLeft size={16} /> Voltar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              if (confirm(`Remover cartão "${selected.name}"?`)) {
                removeCard(selected.id);
                setSelectedId(null);
              }
            }}
            className="text-destructive hover:text-destructive gap-1"
          >
            <Trash2 size={14} /> Remover
          </Button>
        </div>

        <div className="max-w-sm mx-auto">
          <CardVisual
            name={selected.name}
            bank={selected.bank}
            brand={selected.brand}
            closingDay={selected.closing_day}
            color={selected.color}
          />
        </div>

        {invoices && (
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">Faturas do cartão</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-primary/10 border border-primary/20 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                    Fatura atual
                  </p>
                  <p className="text-xl font-bold text-primary mt-1 tabular-nums truncate">
                    {formatBRL(invoices.current)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    {formatDateShort(invoices.cycles.currentCycleStart)} – {formatDateShort(invoices.cycles.currentCycleEnd)}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-secondary/40 border border-border/40 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                    Próxima fatura
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1 tabular-nums truncate">
                    {formatBRL(invoices.next)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    Fecha em {formatDateShort(invoices.cycles.nextCycleEnd)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 text-center min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Gasto no mês</p>
            <p className="text-lg font-bold text-destructive mt-1 tabular-nums truncate">
              R$ {monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Transações</p>
            <p className="text-lg font-bold text-primary mt-1 tabular-nums">{cardTxs.length}</p>
          </div>
        </div>

        {categoryData.length > 0 && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <h3 className="text-sm font-semibold">Gastos por categoria</h3>
                <Select value={categoryMethodFilter} onValueChange={(v) => setCategoryMethodFilter(v as "all" | "credito" | "debito")}>
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Ambos</SelectItem>
                    <SelectItem value="credito">Crédito</SelectItem>
                    <SelectItem value="debito">Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                      isAnimationActive={false}
                    >
                      {categoryData.map((entry, i) => (
                        <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      isAnimationActive={false}
                      formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} onClick={() => {}} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        <div>
          <h3 className="text-sm font-semibold mb-2">Transações deste cartão</h3>
          <TransactionTable manualTransactions={cardTxs} onRemoveManual={onRemoveTransaction} />
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CreditCard size={16} className="text-primary" /> Meus cartões
        </h3>
        <Button onClick={() => setFormOpen(true)} size="sm" className="gradient-primary border-0 text-white">
          <Plus size={14} className="mr-1" /> Adicionar
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center text-muted-foreground text-sm space-y-2">
            <CreditCard size={32} className="mx-auto opacity-40" />
            <p>Nenhum cartão cadastrado.</p>
            <p className="text-xs">Adicione um cartão para acompanhar seus gastos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c) => {
            const inv = computeCardInvoices(transactions, c.id, c.closing_day);
            return (
              <CardVisual
                key={c.id}
                name={c.name}
                bank={c.bank}
                brand={c.brand}
                closingDay={c.closing_day}
                color={c.color}
                invoiceAmount={inv.current}
                onClick={() => setSelectedId(c.id)}
              />
            );
          })}
        </div>
      )}

      <CardForm open={formOpen} onOpenChange={setFormOpen} onSubmit={addCard} />
    </div>
  );
};

export default CardsTab;
