import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Goal } from "@/hooks/useGoals";

interface Props {
  open: boolean;
  goal: Goal | null;
  onOpenChange: (v: boolean) => void;
  onConfirm: (goal: Goal, amount: number) => Promise<void>;
}

const GoalWithdrawDialog = ({ open, goal, onOpenChange, onConfirm }: Props) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { if (open) setAmount(""); }, [open]);

  if (!goal) return null;
  const max = Number(goal.current_amount);

  const submit = async () => {
    const v = parseFloat(amount);
    if (!Number.isFinite(v) || v <= 0 || v > max) return;
    setSubmitting(true);
    await onConfirm(goal, v);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30">
        <DialogHeader>
          <DialogTitle>Retirar valor</DialogTitle>
          <DialogDescription>
            Meta: {goal.name} · Disponível: R$ {max.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="wd-amount">Valor a retirar (R$)</Label>
            <Input
              id="wd-amount"
              type="number"
              min="0"
              max={max}
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="bg-secondary/30 border-border/50"
            />
          </div>
          <Button
            onClick={submit}
            disabled={submitting}
            className="w-full gradient-primary text-white border-0"
          >
            Confirmar retirada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalWithdrawDialog;
