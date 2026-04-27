import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { ALL_BADGE_KEYS, BADGES } from "@/lib/badges";

const BadgesGrid = () => {
  const { data: unlocked = [], isLoading } = useBadges();
  const unlockedSet = new Set(unlocked.map((b) => b.badge_key));

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">Carregando conquistas...</div>;
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
      {ALL_BADGE_KEYS.map((key, i) => {
        const def = BADGES[key];
        const Icon = def.icon;
        const isUnlocked = unlockedSet.has(key);
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.04 }}
            className={`flex flex-col items-center text-center gap-1.5 p-3 rounded-2xl border transition-all ${
              isUnlocked ? "shadow-md" : "opacity-60"
            }`}
            style={{
              background: isUnlocked ? `${def.color}14` : "hsl(var(--secondary) / 0.4)",
              borderColor: isUnlocked ? `${def.color}55` : "hsl(var(--border))",
            }}
            title={def.description}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: isUnlocked
                  ? `linear-gradient(135deg, ${def.color}, ${def.color}cc)`
                  : "hsl(var(--secondary))",
                boxShadow: isUnlocked ? `0 6px 18px -8px ${def.color}aa` : "none",
              }}
            >
              {isUnlocked ? (
                <Icon size={18} className="text-white" />
              ) : (
                <Lock size={14} className="text-muted-foreground" />
              )}
            </div>
            <p className="text-[11px] font-semibold leading-tight">{def.title}</p>
            <p className="text-[9px] text-muted-foreground line-clamp-2 leading-tight">{def.description}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BadgesGrid;
