import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { AccountStatus } from "@/components/admin/UserStatusBadge";

export const useAccountStatus = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["account_status", user?.id],
    enabled: !!user,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("current_account_status");
      if (error) throw error;
      return (data as AccountStatus) ?? "active";
    },
  });
};
