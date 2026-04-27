import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  code: string;
  issued_at: string;
}

export interface CertificateWithCourse extends Certificate {
  course: { id: string; title: string; color: string; description: string | null } | null;
}

export const useCertificates = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<CertificateWithCourse[]>({
    queryKey: ["certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data: certs, error } = await (supabase as any)
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;
      const list = (certs ?? []) as Certificate[];
      if (list.length === 0) return [];
      const ids = list.map((c) => c.course_id);
      const { data: courses } = await (supabase as any)
        .from("courses")
        .select("id, title, color, description")
        .in("id", ids);
      const map = new Map((courses ?? []).map((c: any) => [c.id, c]));
      return list.map((c) => ({ ...c, course: (map.get(c.course_id) as any) ?? null }));
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const issue = useMutation({
    mutationFn: async (course_id: string) => {
      if (!user) return null;
      // Idempotent
      const { data: existing } = await (supabase as any)
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .eq("course_id", course_id)
        .maybeSingle();
      if (existing) return existing as Certificate;
      const { data, error } = await (supabase as any)
        .from("certificates")
        .insert({ user_id: user.id, course_id })
        .select()
        .single();
      if (error) throw error;
      return data as Certificate;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["certificates", user?.id] }),
  });

  return { ...query, issue };
};

export const useCertificate = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery<CertificateWithCourse | null>({
    queryKey: ["certificate", id, user?.id],
    queryFn: async () => {
      if (!user || !id) return null;
      const { data: cert, error } = await (supabase as any)
        .from("certificates")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      if (!cert) return null;
      const { data: course } = await (supabase as any)
        .from("courses")
        .select("id, title, color, description")
        .eq("id", cert.course_id)
        .maybeSingle();
      return { ...cert, course: course ?? null };
    },
    enabled: !!id && !!user,
  });
};
