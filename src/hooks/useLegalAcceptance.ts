import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export function useHasAcceptedCurrentLegal() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["legal_accepted", user?.id],
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
    queryFn: async (): Promise<boolean> => {
      if (!user) return false;
      const { data, error } = await supabase.rpc("has_accepted_current_legal", { _uid: user.id });
      if (error) throw error;
      return !!data;
    },
  });
}

export function useAcceptCurrentLegal() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("no user");
      const { data: docs, error } = await supabase
        .from("legal_documents")
        .select("id, kind, version")
        .eq("is_current", true);
      if (error) throw error;
      if (!docs || docs.length === 0) return;
      const rows = docs.map((d) => ({
        user_id: user.id,
        document_id: d.id,
        kind: d.kind,
        version: d.version,
        user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 255) : null,
      }));
      const { error: insErr } = await supabase.from("user_legal_acceptances").insert(rows);
      if (insErr) throw insErr;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["legal_accepted", user?.id] });
    },
  });
}

/** Used right after signup — accepts current docs for given user id. */
export async function recordLegalAcceptance(userId: string) {
  const { data: docs, error } = await supabase
    .from("legal_documents")
    .select("id, kind, version")
    .eq("is_current", true);
  if (error || !docs) return;
  const rows = docs.map((d) => ({
    user_id: userId,
    document_id: d.id,
    kind: d.kind,
    version: d.version,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 255) : null,
  }));
  await supabase.from("user_legal_acceptances").insert(rows);
}
