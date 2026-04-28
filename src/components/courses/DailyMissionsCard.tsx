import { motion } from "framer-motion";
import { Check, Circle, Flame, Sparkles } from "lucide-react";
import { useDailyMissions } from "@/hooks/useDailyMissions";
import { MISSION_CATALOG } from "@/lib/dailyMissions";

const DailyMissionsCard = () => {
  const { state, claim } = useDailyMissions();
  const total = state.picked.length;
  const done = state.picked.filter((k) => state.claimed[k]).length;
  const progress = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(150 65% 45% / 0.14), hsl(180 60% 45% / 0.05), hsl(var(--card)))",
        border: "1px solid hsl(150 65% 45% / 0.28)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(150 65% 45%), hsl(180 60% 45%))",
              boxShadow: "0 6px 18px -8px hsl(150 65% 45% / 0.7)",
            }}
          >
            <Flame size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: "hsl(150 65% 40%)" }}>
              Missões diárias
            </p>
            <p className="font-display text-base font-bold leading-tight">
              {done}/{total} concluídas hoje
            </p>
          </div>
        </div>
        {state.bonusClaimed && (
          <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 flex items-center gap-1">
            <Sparkles size={10} /> Bônus
          </span>
        )}
      </div>

      <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden mb-3">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, hsl(150 65% 45%), hsl(180 60% 45%))",
          }}
        />
      </div>

      <div className="grid grid-cols-1 gap-1.5">
        {state.picked.map((k) => {
          const def = MISSION_CATALOG[k];
          const cur = state.progress[k] ?? 0;
          const isComplete = cur >= def.goal;
          const claimed = !!state.claimed[k];
          return (
            <div
              key={k}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 border transition-all ${
                claimed
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : isComplete
                  ? "border-amber-500/40 bg-amber-500/10"
                  : "border-border/40 bg-card/60"
              }`}
            >
              <div className="shrink-0">
                {claimed ? (
                  <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                    <Check size={12} className="text-white" />
                  </div>
                ) : (
                  <Circle size={18} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold truncate">{def.title}</p>
                <p className="text-[10px] text-muted-foreground truncate">{def.description}</p>
              </div>
              {isComplete && !claimed ? (
                <button
                  onClick={() => claim(k)}
                  className="text-[10px] font-bold uppercase px-2 py-1 rounded-md bg-amber-500 text-white hover:bg-amber-600 transition-colors"
                >
                  Resgatar +{def.xp}
                </button>
              ) : (
                <span className="text-[10px] tabular-nums text-muted-foreground">+{def.xp} XP</span>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default DailyMissionsCard;
