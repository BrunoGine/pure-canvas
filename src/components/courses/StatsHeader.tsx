import { motion } from "framer-motion";
import { Flame, Shield, Zap } from "lucide-react";
import { useUserStats, xpForLevel, xpForNextLevel } from "@/hooks/useUserStats";

const MAX_PROTECTION = 3;

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
      className="grid grid-cols-1 sm:grid-cols-3 gap-2"
    >
      {/* Bloco 1 — Nível + XP */}
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

      {/* Bloco 2 — Streak */}
      <div className="glass-card rounded-2xl p-3 flex items-center gap-3 shadow-lg bg-orange-500/[0.04]">
        <div
          className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            streak > 0 ? "bg-gradient-to-br from-orange-400 to-orange-600 shadow-[0_4px_20px_-4px_hsl(25_95%_55%/0.5)]" : "bg-secondary/60"
          }`}
        >
          <Flame size={22} className={streak > 0 ? "text-white" : "text-muted-foreground"} fill={streak > 0 ? "white" : "none"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-xl leading-none">{streak}</span>
            <span className="text-[11px] text-muted-foreground">{streak === 1 ? "dia" : "dias"}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {streak > 0 ? "ofensiva ativa" : "comece sua ofensiva"}
          </p>
        </div>
      </div>

      {/* Bloco 3 — Proteções */}
      <div className="glass-card rounded-2xl p-3 flex items-center gap-3 shadow-lg">
        <div className="flex items-center gap-1 shrink-0">
          {Array.from({ length: MAX_PROTECTION }).map((_, i) => {
            const active = i < protection;
            return (
              <Shield
                key={i}
                size={20}
                className={active ? "text-blue-400" : "text-muted-foreground/30"}
                fill={active ? "currentColor" : "none"}
                strokeWidth={active ? 1.5 : 2}
              />
            );
          })}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1">
            <span className="font-display font-bold text-xl leading-none">{protection}</span>
            <span className="text-[11px] text-muted-foreground">/ {MAX_PROTECTION}</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">escudos restantes</p>
        </div>
      </div>
    </motion.div>
  );
};

export default StatsHeader;
