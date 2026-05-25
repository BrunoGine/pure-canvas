import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminMetrics {
  total_users: number;
  active_today: number;
  new_7d: number;
  new_30d: number;
  premium: number;
  enterprise: number;
  trialing: number;
  companies: number;
  inactive_30d: number;
  suspended: number;
  banned: number;
  soft_deleted: number;
}

export const useAdminMetrics = () =>
  useQuery({
    queryKey: ["admin_metrics"],
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_metrics");
      if (error) throw error;
      return data as AdminMetrics;
    },
  });
