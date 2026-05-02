import { motion } from "framer-motion";
import { Users, CheckCircle2, Crown } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { GOAL_PRESETS, DEFAULT_PRESET } from "./goalPresets";
import type { SharedGoalSummary } from "@/hooks/useSharedGoals";

interface Props {
  goal: SharedGoalSummary;
  onOpen: (g: SharedGoalSummary) => void;
}

const formatBRL = (n: number) =>
  n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SharedGoalCard = ({ goal, onOpen }: Props) => {
  const target = Number(goal.target_amount);
  const current = Number(goal.current_amount);
  const pct = Math.min(100, Math.round((current / target) * 100));
  const preset = GOAL_PRESETS.find((p) => p.key === goal.preset_key) ?? DEFAULT_PRESET;
  const PresetIcon = preset.icon;

  return (
    <motion.button
      onClick={() => onOpen(goal)}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="glass-card rounded-2xl overflow-hidden hover:glow-border transition-all text-left"
    >
      <div className={cn("relative h-28 bg-gradient-to-br flex items-center justify-center", preset.gradient)}>
        <PresetIcon className="text-white/95 drop-shadow-lg" size={44} />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
        {goal.is_completed && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] font-semibold px-2 py-1">
            <CheckCircle2 size={12} /> Concluída
          </div>
        )}
        {goal.my_role === "admin" && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-background/80 backdrop-blur text-[10px] font-semibold px-2 py-1">
            <Crown size={12} className="text-primary" /> Admin
          </div>
        )}
        {goal.pending_count > 0 && (
          <div className="absolute bottom-2 right-2 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-0.5">
            {goal.pending_count} pendente{goal.pending_count > 1 ? "s" : ""}
          </div>
        )}
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
        <div className="flex items-center gap-1 text-xs text-muted-foreground pt-1">
          <Users size={12} /> {goal.member_count} {goal.member_count === 1 ? "participante" : "participantes"}
        </div>
      </div>
    </motion.button>
  );
};

export default SharedGoalCard;
