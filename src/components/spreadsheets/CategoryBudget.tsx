import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertTriangle, DollarSign, Pencil } from "lucide-react";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  type: string;
}

interface CategoryBudgetProps {
  transactions: Transaction[];
  categories: string[];
  budgets: Record<string, number>;
  onUpdateBudgets: (budgets: Record<string, number>) => void;
}

const CategoryBudget = ({ transactions, categories, budgets, onUpdateBudgets }: CategoryBudgetProps) => {
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [budgetValue, setBudgetValue] = useState("");

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const getMonthExpense = (category: string) => {
    return transactions
      .filter(t => {
        const d = new Date(t.date);
        return t.type === "expense" && t.category === category && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  };

  const saveBudget = () => {
    if (!editingCategory || !budgetValue) return;
    const val = parseFloat(budgetValue);
    if (isNaN(val) || val <= 0) return;
    const updated = { ...budgets, [editingCategory]: val };
    onUpdateBudgets(updated);
    setEditingCategory(null);
    setBudgetValue("");
  };

  const categoriesWithBudget = categories.filter(c => budgets[c] && budgets[c] > 0);
  const categoriesWithoutBudget = categories.filter(c => !budgets[c] || budgets[c] <= 0);

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return "bg-destructive";
    if (pct >= 75) return "bg-yellow-500";
    return "gradient-primary";
  };

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-1.5">
            <DollarSign size={15} className="text-primary" /> Orçamento por Categoria
          </h3>
        </div>

        {categoriesWithBudget.length > 0 ? (
          <div className="space-y-3">
            {categoriesWithBudget.map(cat => {
              const spent = getMonthExpense(cat);
              const limit = budgets[cat];
              const pct = Math.min((spent / limit) * 100, 120);
              const overBudget = spent > limit;

              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{cat}</span>
                      {overBudget && (
                        <AlertTriangle size={13} className="text-destructive animate-pulse" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs tabular-nums ${overBudget ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
                        R$ {spent.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} / R$ {limit.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                      </span>
                      <button
                        onClick={() => { setEditingCategory(cat); setBudgetValue(limit.toString()); }}
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <Pencil size={12} />
                      </button>
                    </div>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${getProgressColor(pct)}`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-2">
            Nenhum orçamento definido ainda.
          </p>
        )}

        {categoriesWithoutBudget.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {categoriesWithoutBudget.map(cat => (
              <Button
                key={cat}
                variant="outline"
                size="sm"
                className="text-xs h-7 border-dashed border-border/50"
                onClick={() => { setEditingCategory(cat); setBudgetValue(""); }}
              >
                + {cat}
              </Button>
            ))}
          </div>
        )}

        <Dialog open={!!editingCategory} onOpenChange={(open) => { if (!open) setEditingCategory(null); }}>
          <DialogContent className="glass-card border-border/30">
            <DialogHeader>
              <DialogTitle>Orçamento — {editingCategory}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input
                placeholder="Limite mensal (R$)"
                type="number"
                value={budgetValue}
                onChange={e => setBudgetValue(e.target.value)}
                onKeyDown={e => e.key === "Enter" && saveBudget()}
                className="bg-secondary/30 border-border/50"
              />
              <Button onClick={saveBudget} className="w-full gradient-primary border-0 text-white">
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default CategoryBudget;
