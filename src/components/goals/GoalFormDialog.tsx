import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Sparkles, Loader2, RefreshCw } from "lucide-react";
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

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (input: NewGoalInput) => Promise<unknown>;
}

const buildImageUrl = (name: string) =>
  `https://source.unsplash.com/600x400/?${encodeURIComponent(name.trim())}`;

const GoalFormDialog = ({ open, onOpenChange, onCreate }: Props) => {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [deadline, setDeadline] = useState<Date | undefined>();
  const [imageUrl, setImageUrl] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ amount: number; rationale: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const reset = () => {
    setName("");
    setTarget("");
    setDeadline(undefined);
    setImageUrl("");
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

  const refreshImage = () => {
    if (!name.trim()) return;
    setImageUrl(`${buildImageUrl(name)}&t=${Date.now()}`);
  };

  const handleSubmit = async () => {
    const targetNum = parseFloat(target);
    if (!name.trim() || !Number.isFinite(targetNum) || targetNum <= 0) {
      toast.error("Preencha nome e valor objetivo");
      return;
    }
    setSubmitting(true);
    const finalImage = imageUrl.trim() || buildImageUrl(name);
    const result = await onCreate({
      name: name.trim(),
      target_amount: targetNum,
      deadline: deadline ? format(deadline, "yyyy-MM-dd") : null,
      image_url: finalImage,
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

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="goal-image">Imagem (opcional)</Label>
              <button
                type="button"
                onClick={refreshImage}
                disabled={!name.trim()}
                className="text-xs text-primary flex items-center gap-1 disabled:opacity-40"
              >
                <RefreshCw size={11} /> Sugerir
              </button>
            </div>
            <Input
              id="goal-image"
              placeholder="Cole uma URL ou deixe automática"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="bg-secondary/30 border-border/50"
            />
            {(imageUrl || name.trim()) && (
              <div className="rounded-lg overflow-hidden border border-border/30 h-28 bg-secondary/20">
                <img
                  src={imageUrl || buildImageUrl(name)}
                  alt="prévia"
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.2"; }}
                />
              </div>
            )}
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
