import { motion } from "framer-motion";
import { Flame, Shield, Zap } from "lucide-react";
import { useUserStats, xpForLevel, xpForNextLevel } from "@/hooks/useUserStats";

const StatsHeader = () => {
  const { data: stats } = useUserStats();
  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const streak = stats?.streak ?? 0;
  const protection = stats?.streak_protection ?? 0;

  const base = xpForLevel(level);
  const next = xpForNextLevel(level);
  const pct = Math.min(100, Math.max(0, ((xp - base) / Math.max(1, next - base)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card rounded-2xl p-4 flex items-center gap-4"
    >
      <div className="flex flex-col items-center justify-center w-14 h-14 rounded-xl gradient-primary shadow-glow shrink-0">
        <span className="text-[10px] uppercase text-white/70 leading-none">Nível</span>
        <span className="text-white font-display font-bold text-xl leading-none mt-0.5">{level}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="flex items-center gap-1 text-muted-foreground">
            <Zap size={12} className="text-primary" /> {xp} XP
          </span>
          <span className="text-muted-foreground">{next - xp} XP p/ nv {level + 1}</span>
        </div>
        <div className="h-2 bg-secondary/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="h-full gradient-primary"
          />
        </div>
        <div className="flex items-center gap-3 mt-2">
          <span className="flex items-center gap-1 text-xs">
            <Flame size={14} className={streak > 0 ? "text-orange-500" : "text-muted-foreground"} />
            <span className="font-semibold">{streak}</span>
            <span className="text-muted-foreground">ofensiva</span>
          </span>
          <span className="flex items-center gap-1 text-xs">
            <Shield size={14} className="text-blue-400" />
            <span className="font-semibold">{protection}</span>
            <span className="text-muted-foreground">proteções</span>
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsHeader;
