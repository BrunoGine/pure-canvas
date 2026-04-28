import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats } from "@/hooks/useUserStats";
import { useBadges } from "@/hooks/useBadges";
import { useToast } from "@/hooks/use-toast";
import {
  loadDailyState,
  tickMission as libTick,
  claimMission as libClaim,
  claimDailyBonus,
  isAllComplete,
  MISSION_CATALOG,
  type DailyState,
  type MissionKey,
} from "@/lib/dailyMissions";

export const useDailyMissions = () => {
  const { user } = useAuth();
  const { awardXp } = useUserStats();
  const { award: awardBadge } = useBadges();
  const { toast } = useToast();
  const [state, setState] = useState<DailyState>(() => loadDailyState(user?.id));

  useEffect(() => {
    setState(loadDailyState(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key?.startsWith("daily_missions_")) setState(loadDailyState(user?.id));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [user?.id]);

  const tick = useCallback((key: MissionKey) => {
    const s = libTick(key, user?.id);
    setState({ ...s });
  }, [user?.id]);

  const claim = useCallback(async (key: MissionKey) => {
    const next = libClaim(key, user?.id);
    if (!next) return;
    setState({ ...next });
    const xp = MISSION_CATALOG[key].xp;
    try { await awardXp.mutateAsync(xp); } catch {}
    toast({ title: `+${xp} XP ⚡`, description: `Missão concluída: ${MISSION_CATALOG[key].title}` });
    if (isAllComplete(next)) {
      const bonus = claimDailyBonus(user?.id);
      if (bonus) {
        setState({ ...bonus });
        try { await awardXp.mutateAsync(30); } catch {}
        try { await awardBadge.mutateAsync("daily_complete"); } catch {}
        toast({ title: "+30 XP bônus 🎉", description: "Todas as missões diárias concluídas!" });
      }
    }
  }, [user?.id, awardXp, awardBadge, toast]);

  return { state, tick, claim };
};
