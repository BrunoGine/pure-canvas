import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Goal, RecurringContribution } from "@/hooks/useGoals";

interface Props {
  open: boolean;
  goal: Goal | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: (goal: Goal, amount: number, recurring?: RecurringContribution | null) => Promise<void>;
}

const GoalContributeDialog = ({ open, goal, onOpenChange, onConfirm }: Props) => {
  const [amount, setAmount] = useState("");
  const [recurring, setRecurring] = useState(false);
  const [recAmount, setRecAmount] = useState("");
  const [recDay, setRecDay] = useState("1");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setAmount("");
      setRecurring(false);
      setRecAmount("");
      setRecDay("1");
    }
  }, [open]);

  if (!goal) return null;

  const submit = async () => {
    const v = parseFloat(amount);
    if (!Number.isFinite(v) || v <= 0) return;
    let rec: RecurringContribution | null = null;
    if (recurring) {
      const ra = parseFloat(recAmount);
      const rd = parseInt(recDay, 10);
      if (Number.isFinite(ra) && ra > 0 && rd >= 1 && rd <= 28) {
        rec = { amount: ra, day_of_month: rd };
      }
    }
    setSubmitting(true);
    await onConfirm(goal, v, rec);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30">
        <DialogHeader>
          <DialogTitle>Adicionar valor</DialogTitle>
          <DialogDescription>Meta: {goal.name}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="contrib-amount">Valor (R$)</Label>
            <Input
              id="contrib-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="bg-secondary/30 border-border/50"
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
            <div>
              <p className="text-sm font-medium">Tornar recorrente</p>
              <p className="text-xs text-muted-foreground">Contribuir todo mês automaticamente</p>
            </div>
            <Switch checked={recurring} onCheckedChange={setRecurring} />
          </div>

          {recurring && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Valor mensal</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={recAmount}
                  onChange={(e) => setRecAmount(e.target.value)}
                  className="bg-secondary/30 border-border/50"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Dia do mês</Label>
                <Select value={recDay} onValueChange={setRecDay}>
                  <SelectTrigger className="bg-secondary/30 border-border/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                      <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <Button
            onClick={submit}
            disabled={submitting}
            className="w-full gradient-primary text-white border-0"
          >
            Confirmar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalContributeDialog;
