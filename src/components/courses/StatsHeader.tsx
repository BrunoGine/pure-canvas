import { motion } from "framer-motion";
import { Zap } from "lucide-react";
import { useUserStats, xpForLevel, xpForNextLevel } from "@/hooks/useUserStats";

const StatsHeader = () => {
  const { data: stats } = useUserStats();
  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;

  const base = xpForLevel(level);
  const next = xpForNextLevel(level);
  const pct = Math.min(100, Math.max(0, ((xp - base) / Math.max(1, next - base)) * 100));

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="glass-card rounded-2xl p-3 flex items-center gap-3 shadow-lg">
        <div className="flex flex-col items-center justify-center w-12 h-12 rounded-xl gradient-primary shadow-glow shrink-0">
          <span className="text-[9px] uppercase text-white/70 leading-none tracking-wide">Nv</span>
          <span className="text-white font-display font-bold text-lg leading-none mt-0.5">{level}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Zap size={11} className="text-primary" /> {xp} XP
            </span>
            <span className="text-muted-foreground">{Math.max(0, next - xp)} p/ nv {level + 1}</span>
          </div>
          <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
            <div
              className="h-full gradient-primary transition-all duration-500"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsHeader;
