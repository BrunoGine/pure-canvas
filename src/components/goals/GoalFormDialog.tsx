import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Sparkles, Loader2, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { NewGoalInput } from "@/hooks/useGoals";
import { GOAL_PRESETS, presetToImageUrl } from "./goalPresets";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: NewGoalInput) => Promise<unknown>;
}

const GoalFormDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [presetKey, setPresetKey] = useState<string>("other");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ amount: number; rationale: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setTarget("");
    setDeadline(undefined);
    setPresetKey("other");
    setAiSuggestion(null);
  };

  const handleSuggest = async () => {
    if (!name.trim()) {
      toast.error("Digite o nome da meta primeiro");
      return;
    }
    setAiLoading(true);
    setAiSuggestion(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-goal-amount", {
        body: { name: name.trim(), deadline: deadline ? format(deadline, "yyyy-MM-dd") : undefined },
      });
      if (error) throw error;
      if (data?.amount) {
        setAiSuggestion({ amount: data.amount, rationale: data.rationale ?? "" });
      } else {
        toast.error("Não consegui sugerir um valor agora");
      }
    } catch (e) {
      console.error(e);
      toast.error("Erro ao consultar Harp.I.A");
    } finally {
      setAiLoading(false);
    }
  };

  const handleAccept = () => {
    if (aiSuggestion) {
      setTarget(String(aiSuggestion.amount));
      setAiSuggestion(null);
    }
  };

  const handleSubmit = async () => {
    const targetNum = parseFloat(target);
    if (!name.trim() || !Number.isFinite(targetNum) || targetNum <= 0) {
      toast.error("Preencha nome e valor objetivo");
      return;
    }
    setSubmitting(true);
    const result = await onCreate({
      name: name.trim(),
      target_amount: targetNum,
      deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      image_url: presetToImageUrl(presetKey),
    });
    setSubmitting(false);
    if (result) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="glass-card border-border/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Meta</DialogTitle>
          <DialogDescription>Defina seu objetivo e quanto quer juntar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="goal-name">Nome da meta</Label>
            <Input
              id="goal-name"
              placeholder="Ex.: Viagem para a praia"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="bg-secondary/30 border-border/50"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="goal-target">Valor objetivo (R$)</Label>
            <Input
              id="goal-target"
              type="number"
              min="0"
              step="0.01"
              placeholder="0,00"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              className="bg-secondary/30 border-border/50"
            />
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={handleSuggest}
            disabled={aiLoading || !name.trim()}
            className="w-full gap-2 border-primary/40 text-primary hover:bg-primary/10"
          >
            {aiLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Me ajude a definir o valor
          </Button>

          {aiSuggestion && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
              <p className="text-sm">
                <span className="font-semibold text-primary">Sugestão:</span> R${" "}
                {aiSuggestion.amount.toLocaleString("pt-BR")}
              </p>
              {aiSuggestion.rationale && (
                <p className="text-xs text-muted-foreground">{aiSuggestion.rationale}</p>
              )}
              <div className="flex gap-2">
                <Button size="sm" onClick={handleAccept} className="gradient-primary text-white border-0 flex-1">
                  Usar este valor
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setAiSuggestion(null)} className="flex-1">
                  Recusar
                </Button>
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label>Prazo (opcional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-secondary/30 border-border/50",
                    !deadline && "text-muted-foreground",
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {deadline ? format(deadline, "dd/MM/yyyy", { locale: ptBR }) : "Sem prazo"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={deadline}
                  onSelect={setDeadline}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
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
                    aria-pressed={selected}
                    aria-label={p.label}
                  >
                    <div
                      className={cn(
                        "w-full aspect-square rounded-lg bg-gradient-to-br flex items-center justify-center",
                        p.gradient,
                      )}
                    >
                      <Icon className="text-white drop-shadow" size={20} />
                    </div>
                    <span className="text-[10px] font-medium text-foreground/80 truncate w-full text-center">
                      {p.label}
                    </span>
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

          <Button
            onClick={handleSubmit}
            disabled={submitting}
            className="w-full gradient-primary text-white border-0"
          >
            {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Criar meta
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default GoalFormDialog;
