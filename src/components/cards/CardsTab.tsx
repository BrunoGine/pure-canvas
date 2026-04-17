import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, Trash2, CreditCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Transaction } from "@/hooks/useTransactions";
import CardVisual from "./CardVisual";
import CardForm from "./CardForm";
import TransactionTable from "@/components/spreadsheets/TransactionTable";

interface Props {
  transactions: Transaction[];
  onRemoveTransaction: (id: string) => void;
}

const COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4", "#F97316", "#14B8A6"];

const CardsTab = ({ transactions, onRemoveTransaction }: Props) => {
  const { cards, addCard, removeCard } = useCreditCards();
  const [formOpen, setFormOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

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
      .forEach((t) => {
        const cat = t.category || "Sem categoria";
        grouped[cat] = (grouped[cat] || 0) + Math.abs(t.amount);
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [cardTxs]);

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

        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Gasto no mês</p>
            <p className="text-lg font-bold text-destructive mt-1 tabular-nums">
              R$ {monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">Transações</p>
            <p className="text-lg font-bold text-primary mt-1 tabular-nums">{cardTxs.length}</p>
          </div>
        </div>

        {categoryData.length > 0 && (
          <Card className="shadow-card">
            <CardContent className="p-4">
              <h3 className="text-sm font-semibold mb-3">Gastos por categoria</h3>
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
                      paddingAngle={4}
                    >
                      {categoryData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                    />
                    <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} />
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
          {cards.map((c) => (
            <CardVisual
              key={c.id}
              name={c.name}
              bank={c.bank}
              brand={c.brand}
              closingDay={c.closing_day}
              color={c.color}
              onClick={() => setSelectedId(c.id)}
            />
          ))}
        </div>
      )}

      <CardForm open={formOpen} onOpenChange={setFormOpen} onSubmit={addCard} />
    </div>
  );
};

export default CardsTab;
