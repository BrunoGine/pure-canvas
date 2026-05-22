import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type LegalKind = "terms" | "privacy";

export interface LegalDocument {
  id: string;
  kind: LegalKind;
  version: string;
  content_md: string;
  published_at: string;
}

export function useCurrentLegalDocument(kind: LegalKind) {
  return useQuery({
    queryKey: ["legal_document", kind],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<LegalDocument | null> => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("id, kind, version, content_md, published_at")
        .eq("kind", kind)
        .eq("is_current", true)
        .maybeSingle();
      if (error) throw error;
      return (data as LegalDocument) ?? null;
    },
  });
}

export function useCurrentLegalDocuments() {
  return useQuery({
    queryKey: ["legal_documents", "current"],
    staleTime: 60 * 60 * 1000,
    queryFn: async (): Promise<LegalDocument[]> => {
      const { data, error } = await supabase
        .from("legal_documents")
        .select("id, kind, version, content_md, published_at")
        .eq("is_current", true);
      if (error) throw error;
      return (data ?? []) as LegalDocument[];
    },
  });
}
