import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface UserBadge {
  id: string;
  user_id: string;
  badge_key: string;
  unlocked_at: string;
}

export const useBadges = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

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
    staleTime: 60_000,
  });

  const award = useMutation({
    mutationFn: async (badge_key: string) => {
      if (!user) return null;
      const { data, error } = await (supabase as any).rpc("award_user_badge", {
        _badge_key: badge_key,
      });
      if (error) throw error;
      return { badge: data };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["user_badges", user?.id] }),
  });

  return { ...query, award };
};
