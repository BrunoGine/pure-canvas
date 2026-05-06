import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Wallet, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useBudgets, type Budget } from "@/hooks/useBudgets";
import BudgetFormDialog from "./BudgetFormDialog";

interface Tx {
  amount: number;
  date: string;
  category: string;
  type: string;
}

interface Props {
  transactions: Tx[];
  categories: string[];
}

const BudgetsTab = ({ transactions, categories }: Props) => {
  const { budgets, loading, addBudget, updateBudget, removeBudget } = useBudgets();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Budget | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const now = new Date();
  const m = now.getMonth();
  const y = now.getFullYear();

  const spentByCategory = useMemo(() => {
    const map: Record<string, number> = {};
    for (const t of transactions) {
      if (t.type !== "expense") continue;
      const d = new Date(t.date);
      if (d.getMonth() !== m || d.getFullYear() !== y) continue;
      map[t.category] = (map[t.category] ?? 0) + Math.abs(t.amount);
    }
    return map;
  }, [transactions, m, y]);

  const enriched = useMemo(() => {
    return budgets
      .map((b) => {
        const spent = spentByCategory[b.category] ?? 0;
        const pct = b.limit_amount > 0 ? (spent / b.limit_amount) * 100 : 0;
        return { ...b, spent, pct };
      })
      .sort((a, b) => b.pct - a.pct);
  }, [budgets, spentByCategory]);

  const existingCategories = budgets.map((b) => b.category);

  const getColor = (pct: number) => {
    if (pct > 90) return "bg-destructive";
    if (pct >= 60) return "bg-yellow-500";
    return "bg-emerald-500";
  };

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (b: Budget) => {
    setEditing(b);
    setFormOpen(true);
  };

  const handleSubmit = async (data: { category: string; limit_amount: number }) => {
    if (editing) {
      await updateBudget(editing.id, data);
    } else {
      await addBudget(data);
    }
  };

  const confirmDelete = async () => {
    if (deletingId) {
      await removeBudget(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <Wallet size={15} className="text-primary" /> Orçamentos
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">Controle seus gastos por categoria</p>
        </div>
        {budgets.length > 0 && (
          <Button onClick={openCreate} size="sm" className="gradient-primary border-0 text-white">
            <Plus size={14} className="mr-1" /> Criar
          </Button>
        )}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card rounded-xl p-4 h-24 animate-pulse" />
          ))}
        </div>
      ) : enriched.length === 0 ? (
        <div className="glass-card rounded-xl p-8 text-center space-y-3">
          <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Wallet size={22} className="text-primary" />
          </div>
          <div>
            <p className="font-medium">Nenhum orçamento ainda</p>
            <p className="text-xs text-muted-foreground mt-1">
              Defina limites por categoria para controlar seus gastos
            </p>
          </div>
          <Button onClick={openCreate} className="gradient-primary border-0 text-white">
            <Plus size={16} className="mr-1" /> Criar primeiro orçamento
          </Button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {enriched.map((b, idx) => {
            const overBudget = b.spent > b.limit_amount;
            const displayPct = Math.min(b.pct, 100);
            return (
              <motion.div
                key={b.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03 }}
                className="glass-card rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium text-sm truncate">{b.category}</span>
                      {overBudget && (
                        <span className="flex items-center gap-1 text-[10px] uppercase tracking-wider font-semibold text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                          <AlertTriangle size={10} className="animate-pulse" /> Excedido
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 tabular-nums">
                      R$ {b.spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R${" "}
                      {b.limit_amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => openEdit(b)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-primary hover:bg-secondary/50 transition-colors"
                      aria-label="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      onClick={() => setDeletingId(b.id)}
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      aria-label="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getColor(b.pct)}`}
                      style={{ width: `${displayPct}%` }}
                    />
                  </div>
                  <div className="flex justify-end">
                    <span
                      className={`text-[11px] font-semibold tabular-nums ${
                        overBudget
                          ? "text-destructive"
                          : b.pct >= 60
                            ? "text-yellow-500"
                            : "text-emerald-500"
                      }`}
                    >
                      {b.pct.toFixed(0)}%
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <BudgetFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        categories={categories}
        existingCategories={existingCategories}
        initial={editing}
        onSubmit={handleSubmit}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(o) => !o && setDeletingId(null)}>
        <AlertDialogContent className="glass-card border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir orçamento?</AlertDialogTitle>
            <AlertDialogDescription>
              As transações dessa categoria serão mantidas. Apenas o limite será removido.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BudgetsTab;
