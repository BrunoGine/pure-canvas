import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface PrivacySettings {
  user_id: string;
  hide_avatar_in_shared_goals: boolean;
  hide_contribution_amount: boolean;
  hide_profile_in_public_lists: boolean;
  require_invite_approval: boolean;
  disable_social_recommendations: boolean;
  hide_recent_activity: boolean;
  ai_use_financial_data: boolean;
  ai_use_business_data: boolean;
  email_essential: boolean;
  email_marketing: boolean;
  email_product_updates: boolean;
  email_financial_tips: boolean;
}

export type PrivacyKey = Exclude<keyof PrivacySettings, "user_id" | "email_essential">;

const DEFAULTS: Omit<PrivacySettings, "user_id"> = {
  hide_avatar_in_shared_goals: false,
  hide_contribution_amount: false,
  hide_profile_in_public_lists: false,
  require_invite_approval: false,
  disable_social_recommendations: false,
  hide_recent_activity: false,
  ai_use_financial_data: true,
  ai_use_business_data: true,
  email_essential: true,
  email_marketing: false,
  email_product_updates: true,
  email_financial_tips: true,
};

export function usePrivacySettings() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery({
    queryKey: ["privacy_settings", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<PrivacySettings> => {
      if (!user) throw new Error("no user");
      const { data, error } = await supabase
        .from("privacy_settings")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (data) return data as PrivacySettings;
      // Auto-create if missing (defensive)
      const { data: inserted, error: insErr } = await supabase
        .from("privacy_settings")
        .insert({ user_id: user.id })
        .select("*")
        .single();
      if (insErr) throw insErr;
      return inserted as PrivacySettings;
    },
  });

  const mutation = useMutation({
    mutationFn: async (patch: Partial<Record<PrivacyKey, boolean>>) => {
      if (!user) throw new Error("no user");
      const { data, error } = await supabase
        .from("privacy_settings")
        .update(patch)
        .eq("user_id", user.id)
        .select("*")
        .single();
      if (error) throw error;
      return data as PrivacySettings;
    },
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: ["privacy_settings", user?.id] });
      const prev = qc.getQueryData<PrivacySettings>(["privacy_settings", user?.id]);
      if (prev) {
        qc.setQueryData<PrivacySettings>(["privacy_settings", user?.id], { ...prev, ...patch });
      }
      return { prev };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.prev) qc.setQueryData(["privacy_settings", user?.id], ctx.prev);
      toast.error("Não foi possível salvar a preferência");
    },
    onSuccess: () => {
      toast.success("Preferência salva", { duration: 1500 });
    },
  });

  return {
    settings: query.data ?? ({ user_id: user?.id ?? "", ...DEFAULTS } as PrivacySettings),
    isLoading: query.isLoading,
    update: mutation.mutate,
    isUpdating: mutation.isPending,
  };
}
