import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { BADGES, getBadge } from "@/lib/badges";
import { useCallback } from "react";

export interface UserBadge {
  id: string;
  badge_key: string;
  unlocked_at: string;
}

const ANSWERS_KEY = "harp_answers_count";

export const incrementAnswersCount = (n: number) => {
  try {
    const cur = parseInt(localStorage.getItem(ANSWERS_KEY) || "0", 10) || 0;
    localStorage.setItem(ANSWERS_KEY, String(cur + n));
  } catch {}
};

export const getAnswersCount = (): number => {
  try {
    return parseInt(localStorage.getItem(ANSWERS_KEY) || "0", 10) || 0;
  } catch {
    return 0;
  }
};

export const useBadges = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { toast } = useToast();

  const query = useQuery<UserBadge[]>({
    queryKey: ["user_badges", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("user_badges")
        .select("*")
        .eq("user_id", user.id)
        .order("unlocked_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as UserBadge[];
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const award = useCallback(async (key: string) => {
    if (!user) return false;
    const has = (query.data ?? []).some((b) => b.badge_key === key);
    if (has) return false;
    const { error } = await (supabase as any)
      .from("user_badges")
      .insert({ user_id: user.id, badge_key: key });
    if (error) {
      // unique constraint = already there
      return false;
    }
    const def = getBadge(key);
    toast({
      title: `🏆 Conquista desbloqueada!`,
      description: `${def.name} — ${def.description}`,
    });
    qc.invalidateQueries({ queryKey: ["user_badges", user.id] });
    return true;
  }, [user, query.data, qc, toast]);

  /**
   * Verifica todos os marcos a partir de stats e progresso atuais.
   * Chame após eventos relevantes (concluir aula, ganhar XP, atualizar streak).
   */
  const checkAndAward = useCallback(async (ctx: {
    xp?: number;
    streak?: number;
    completedLessonsCount?: number;
    completedCoursesCount?: number;
  }) => {
    if (!user) return;
    const tasks: Promise<boolean>[] = [];
    if ((ctx.completedLessonsCount ?? 0) >= 1) tasks.push(award("first_lesson"));
    if ((ctx.streak ?? 0) >= 7) tasks.push(award("streak_7"));
    if ((ctx.streak ?? 0) >= 30) tasks.push(award("streak_30"));
    if (getAnswersCount() >= 50) tasks.push(award("answers_50"));
    if ((ctx.completedCoursesCount ?? 0) >= 1) tasks.push(award("first_world"));
    if ((ctx.xp ?? 0) >= 1000) tasks.push(award("xp_1000"));
    await Promise.all(tasks);
  }, [user, award]);

  return {
    ...query,
    badges: query.data ?? [],
    allBadges: BADGES,
    award,
    checkAndAward,
  };
};
