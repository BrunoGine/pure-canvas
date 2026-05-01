import { motion } from "framer-motion";
import { MoreVertical, Plus, Minus, Trash2, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { Goal } from "@/hooks/useGoals";
import { getGoalPreset } from "./goalPresets";

interface Props {
  goal: Goal;
  onContribute: (g: Goal) => void;
  onWithdraw: (g: Goal) => void;
  onDelete: (g: Goal) => void;
}

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const GoalCard = ({ goal, onContribute, onWithdraw, onDelete }: Props) => {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const pct = Math.min(100, Math.round((current / target) * 100));
  const preset = getGoalPreset(goal.image_url);
  const PresetIcon = preset.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl overflow-hidden hover:glow-border transition-all"
    >
      <div className={cn("relative h-28 bg-gradient-to-br flex items-center justify-center", preset.gradient)}>
        <PresetIcon className="text-white/95 drop-shadow-lg" size={44} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
        {goal.is_completed && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-1">
            <CheckCircle2 size={12} /> Concluída
          </div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              aria-label="Ações da meta"
              className="absolute top-2 right-2 rounded-full bg-background/70 backdrop-blur p-1.5 hover:bg-background"
            >
              <MoreVertical size={14} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="glass-card border-border/30">
            <DropdownMenuItem onClick={() => onContribute(goal)} disabled={goal.is_completed}>
              <Plus size={14} className="mr-2" /> Adicionar valor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onWithdraw(goal)} disabled={current <= 0}>
              <Minus size={14} className="mr-2" /> Retirar valor
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onDelete(goal)} className="text-destructive">
              <Trash2 size={14} className="mr-2" /> Excluir meta
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="p-4 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-display font-semibold truncate">{goal.name}</h3>
          <span className="text-xs font-bold text-primary tabular-nums">{pct}%</span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground tabular-nums">
          <span>R$ {formatBRL(current)}</span>
          <span>R$ {formatBRL(target)}</span>
        </div>
        {!goal.is_completed && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onContribute(goal)}
              className="flex-1 gradient-primary text-white rounded-lg py-1.5 text-xs font-semibold flex items-center justify-center gap-1 hover:opacity-90 transition-opacity"
            >
              <Plus size={12} /> Adicionar
            </button>
            <button
              onClick={() => onWithdraw(goal)}
              disabled={current <= 0}
              className="flex-1 border border-border/50 rounded-lg py-1.5 text-xs font-medium flex items-center justify-center gap-1 hover:bg-secondary/50 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Minus size={12} /> Retirar
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default GoalCard;
