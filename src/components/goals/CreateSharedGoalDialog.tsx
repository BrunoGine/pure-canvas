import { useState } from "react";
import { Loader2, Check, Copy, Share2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GOAL_PRESETS } from "./goalPresets";
import type { SharedGoal } from "@/hooks/useSharedGoals";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: { name: string; target_amount: number; preset_key: string }) => Promise<SharedGoal | null>;
}

const CreateSharedGoalDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [presetKey, setPresetKey] = useState("other");
  const [submitting, setSubmitting] = useState(false);
  const [created, setCreated] = useState<SharedGoal | null>(null);

  const reset = () => {
    setName("");
    setTarget("");
    setPresetKey("other");
    setCreated(null);
  };

  const handleSubmit = async () => {
    const targetNum = parseFloat(target);
    if (!name.trim() || !Number.isFinite(targetNum) || targetNum <= 0) {
      toast.error("Preencha nome e valor válidos");
      return;
    }
    setSubmitting(true);
    const result = await onCreate({ name: name.trim(), target_amount: targetNum, preset_key: presetKey });
    setSubmitting(false);
    if (result) setCreated(result);
  };

  const copyCode = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.invite_code);
    toast.success("Código copiado!");
  };

  const shareCode = async () => {
    if (!created) return;
    const text = `Entre na minha vaquinha "${created.name}" usando o código: ${created.invite_code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Vaquinha", text });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard.writeText(text);
      toast.success("Mensagem copiada!");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent className="glass-card border-border/30 max-h-[90vh] overflow-y-auto">
        {!created ? (
          <>
            <DialogHeader>
              <DialogTitle>Nova Vaquinha</DialogTitle>
              <DialogDescription>Convide pessoas para um objetivo em comum.</DialogDescription>
            </DialogHeader>

            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="sg-name">Nome</Label>
                <Input
                  id="sg-name"
                  placeholder="Ex.: Festa de aniversário"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={80}
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="sg-target">Valor objetivo (R$)</Label>
                <Input
                  id="sg-target"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0,00"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="bg-secondary/30 border-border/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Categoria</Label>
                <div className="grid grid-cols-4 gap-2">
                  {GOAL_PRESETS.map((p) => {
                    const Icon = p.icon;
                    const selected = presetKey === p.key;
                    return (
                      <button
                        key={p.key}
                        type="button"
                        onClick={() => setPresetKey(p.key)}
                        className={cn(
                          "relative flex flex-col items-center gap-1 rounded-xl p-2 transition-all",
                          "border border-border/40 hover:border-primary/60",
                          selected && "ring-2 ring-primary ring-offset-2 ring-offset-background border-transparent",
                        )}
                      >
                        <div className={cn("w-full aspect-square rounded-lg bg-gradient-to-br flex items-center justify-center", p.gradient)}>
                          <Icon className="text-white drop-shadow" size={20} />
                        </div>
                        <span className="text-[10px] font-medium text-foreground/80 truncate w-full text-center">{p.label}</span>
                        {selected && (
                          <div className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full p-0.5">
                            <Check size={10} />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={submitting} className="w-full gradient-primary text-white border-0">
                {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
                Criar vaquinha
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Vaquinha criada! 🎉</DialogTitle>
              <DialogDescription>Compartilhe o código abaixo com quem quiser participar.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-6 text-center">
                <p className="text-xs text-muted-foreground mb-1">Código de convite</p>
                <p className="font-display text-3xl font-bold tracking-widest text-primary">{created.invite_code}</p>
              </div>
              <div className="flex gap-2">
                <Button onClick={copyCode} variant="outline" className="flex-1 gap-2">
                  <Copy size={14} /> Copiar
                </Button>
                <Button onClick={shareCode} className="flex-1 gradient-primary text-white border-0 gap-2">
                  <Share2 size={14} /> Compartilhar
                </Button>
              </div>
              <Button
                variant="ghost"
                className="w-full"
                onClick={() => {
                  reset();
                  onOpenChange(false);
                }}
              >
                Fechar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CreateSharedGoalDialog;
