import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminUserDetail = (userId: string | undefined) =>
  useQuery({
    queryKey: ["admin_user_detail", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("admin_get_user_detail", { _user_id: userId });
      if (error) throw error;
      return data as any;
    },
  });
