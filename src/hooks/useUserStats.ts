import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserStats {
  user_id: string;
  xp: number;
  level: number;
  streak: number;
  streak_protection: number;
  streak_protection_reset_at: string;
  last_activity_date: string | null;
  updated_at: string;
}

export const xpForLevel = (level: number) => Math.pow(level - 1, 2) * 100;
export const xpForNextLevel = (level: number) => Math.pow(level, 2) * 100;

export const useUserStats = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<UserStats | null>({
    queryKey: ["user_stats", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from("user_stats")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const { data: inserted } = await (supabase as any)
          .from("user_stats")
          .insert({ user_id: user.id })
          .select()
          .single();
        return inserted as UserStats;
      }
      return data as UserStats;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const awardXp = useMutation({
    mutationFn: async (amount: number) => {
      if (!user) return null;
      const { data, error } = await (supabase as any).rpc("award_xp", {
        _user_id: user.id,
        _amount: amount,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_stats", user?.id] }),
  });

  const updateStreak = useMutation({
    mutationFn: async () => {
      if (!user) return null;
      const { data, error } = await (supabase as any).rpc("update_streak", { _user_id: user.id });
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_stats", user?.id] }),
  });

  return { ...query, awardXp, updateStreak };
};
