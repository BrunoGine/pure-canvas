import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  title: string;
  description: string;
  cta: string;
  onOpenChange: (v: boolean) => void;
  onConfirm: (amount: number) => Promise<void> | void;
  max?: number;
}

const SharedAmountDialog = ({ open, title, description, cta, onOpenChange, onConfirm, max }: Props) => {
  const [amount, setAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) setAmount("");
  }, [open]);

  const submit = async () => {
    const v = parseFloat(amount);
    if (!Number.isFinite(v) || v <= 0) return;
    if (max !== undefined && v > max) return;
    setSubmitting(true);
    await onConfirm(v);
    setSubmitting(false);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="sa-amount">Valor (R$)</Label>
            <Input
              id="sa-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              autoFocus
              className="bg-secondary/30 border-border/50"
            />
            {max !== undefined && (
              <p className="text-xs text-muted-foreground">
                Disponível: R$ {max.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            )}
          </div>
          <Button onClick={submit} disabled={submitting} className="w-full gradient-primary text-white border-0">
            {cta}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SharedAmountDialog;
