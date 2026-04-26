import { motion } from "framer-motion";
import { Lock } from "lucide-react";
import { useBadges } from "@/hooks/useBadges";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const BadgesGrid = () => {
  const { badges, allBadges, isLoading } = useBadges();
  const unlockedMap = new Map(badges.map((b) => [b.badge_key, b.unlocked_at]));

  if (isLoading) {
    return <div className="text-xs text-muted-foreground">Carregando conquistas...</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {allBadges.map((b, i) => {
        const unlockedAt = unlockedMap.get(b.key);
        const unlocked = !!unlockedAt;
        const Icon = b.icon;
        return (
          <motion.div
            key={b.key}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`glass-card rounded-xl p-3 flex flex-col items-center gap-1.5 text-center transition-all ${
              unlocked ? "" : "opacity-50 grayscale"
            }`}
            title={b.description}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{
                background: unlocked
                  ? `linear-gradient(135deg, ${b.color}, ${b.color}cc)`
                  : "hsl(var(--secondary))",
                boxShadow: unlocked ? `0 4px 14px -4px ${b.color}88` : undefined,
              }}
            >
              {unlocked ? (
                <Icon size={18} className="text-white" />
              ) : (
                <Lock size={14} className="text-muted-foreground" />
              )}
            </div>
            <p className="text-[10px] font-semibold leading-tight line-clamp-2">{b.name}</p>
            {unlocked && unlockedAt && (
              <p className="text-[9px] text-muted-foreground">
                {format(new Date(unlockedAt), "dd MMM", { locale: ptBR })}
              </p>
            )}
          </motion.div>
        );
      })}
    </div>
  );
};

export default BadgesGrid;
