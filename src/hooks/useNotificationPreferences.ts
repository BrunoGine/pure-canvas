import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NotificationPreferences {
  user_id: string;
  master_enabled: boolean;
  financial: boolean;
  goals: boolean;
  courses: boolean;
  streak: boolean;
  harpia: boolean;
  business: boolean;
  shared_goals: boolean;
  security: boolean;
  marketing: boolean;
  quiet_hours_start: number;
  quiet_hours_end: number;
  timezone: string;
}

export type NotificationPrefKey = Exclude<keyof NotificationPreferences, "user_id" | "timezone">;

const DEFAULTS: Omit<NotificationPreferences, "user_id"> = {
  master_enabled: true,
  financial: true,
  goals: true,
  courses: true,
  streak: true,
  harpia: true,
  business: true,
  shared_goals: true,
  security: true,
  marketing: false,
  quiet_hours_start: 22,
  quiet_hours_end: 8,
  timezone: "America/Sao_Paulo",
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const key = ["notification_preferences", user?.id];

  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<NotificationPreferences> => {
      if (!user) throw new Error("no user");
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as NotificationPreferences;
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Sao_Paulo";
      const { data: inserted, error: insErr } = await (supabase as any)
        .from("notification_preferences")
        .insert({ user_id: user.id, timezone: tz })
        .select("*")
        .single();
      if (insErr) throw insErr;
      return inserted as NotificationPreferences;
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<NotificationPreferences>) => {
      if (!user) throw new Error("no user");
      const { data, error } = await (supabase as any)
        .from("notification_preferences")
        .update(patch)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as NotificationPreferences;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<NotificationPreferences>(key);
      if (prev) qc.setQueryData<NotificationPreferences>(key, { ...prev, ...patch });
      return { prev };
    },
    onError: (_e, _p, ctx) => {
      if (ctx?.prev) qc.setQueryData(key, ctx.prev);
      toast.error("Não foi possível salvar a preferência");
    },
    onSuccess: () => toast.success("Preferência salva", { duration: 1200 }),
  });

  return {
    prefs: query.data ?? ({ user_id: user?.id ?? "", ...DEFAULTS } as NotificationPreferences),
    isLoading: query.isLoading,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
