import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface DeviceCredentialRow {
  id: string;
  user_id: string;
  device_label: string;
  credential_id: string;
  public_key: string;
  sign_count: number;
  last_used_at: string;
  created_at: string;
}

export function useDeviceCredentials() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["device_credentials", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<DeviceCredentialRow[]> => {
      const { data, error } = await supabase
        .from("device_credentials")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as DeviceCredentialRow[];
    },
  });
}

export function useSaveDeviceCredential() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      credentialId: string;
      publicKey: string;
      deviceLabel: string;
    }) => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("device_credentials").insert({
        user_id: user.id,
        credential_id: input.credentialId,
        public_key: input.publicKey,
        device_label: input.deviceLabel,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["device_credentials", user?.id] });
    },
  });
}

export function useDeleteDeviceCredential() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (credentialId: string) => {
      const { error } = await supabase
        .from("device_credentials")
        .delete()
        .eq("credential_id", credentialId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["device_credentials", user?.id] });
    },
  });
}

export async function touchCredentialUsage(credentialId: string) {
  await supabase
    .from("device_credentials")
    .update({ last_used_at: new Date().toISOString() })
    .eq("credential_id", credentialId);
}
