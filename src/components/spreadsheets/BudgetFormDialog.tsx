import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import type { Budget } from "@/hooks/useBudgets";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  categories: string[];
  existingCategories: string[]; // categories already with a budget
  initial?: Budget | null;
  onSubmit: (data: { category: string; limit_amount: number }) => void | Promise<void>;
}

const BudgetFormDialog = ({ open, onOpenChange, categories, existingCategories, initial, onSubmit }: Props) => {
  const [category, setCategory] = useState<string>("");
  const [limit, setLimit] = useState<string>("");

  useEffect(() => {
    if (open) {
      setCategory(initial?.category ?? "");
      setLimit(initial ? String(initial.limit_amount) : "");
    }
  }, [open, initial]);

  const availableCategories = categories.filter(
    (c) => c === initial?.category || !existingCategories.includes(c),
  );

  const handleSave = async () => {
    const value = parseFloat(limit);
    if (!category || !value || value <= 0) return;
    await onSubmit({ category, limit_amount: value });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30">
        <DialogHeader>
          <DialogTitle>{initial ? "Editar orçamento" : "Novo orçamento"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">Categoria</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary/30 border-border/50">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {availableCategories.length === 0 && (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">
                    Todas as categorias já têm orçamento
                  </div>
                )}
                {availableCategories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Limite mensal (R$)</Label>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={limit}
              onChange={(e) => setLimit(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
              className="bg-secondary/30 border-border/50"
            />
          </div>
          <Button onClick={handleSave} className="w-full gradient-primary border-0 text-white">
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BudgetFormDialog;
