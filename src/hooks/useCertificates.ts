import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCallback } from "react";

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  code: string;
  issued_at: string;
  course_title?: string;
  course_color?: string;
}

export const useCertificates = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<Certificate[]>({
    queryKey: ["certificates", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase as any)
        .from("certificates")
        .select("*")
        .eq("user_id", user.id)
        .order("issued_at", { ascending: false });
      if (error) throw error;

      const certs = (data ?? []) as Certificate[];
      if (certs.length === 0) return [];

      const courseIds = Array.from(new Set(certs.map((c) => c.course_id)));
      const { data: courses } = await (supabase as any)
        .from("courses")
        .select("id, title, color")
        .in("id", courseIds);
      const map = new Map<string, { title: string; color: string }>(
        (courses ?? []).map((c: any) => [c.id as string, { title: c.title, color: c.color }])
      );
      return certs.map((c) => ({
        ...c,
        course_title: map.get(c.course_id)?.title,
        course_color: map.get(c.course_id)?.color,
      }));
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const issue = useCallback(async (courseId: string) => {
    if (!user) return null;
    const { data, error } = await (supabase as any)
      .from("certificates")
      .insert({ user_id: user.id, course_id: courseId })
      .select()
      .maybeSingle();
    if (error) {
      // unique violation = already issued
      return null;
    }
    qc.invalidateQueries({ queryKey: ["certificates", user.id] });
    return data as Certificate;
  }, [user, qc]);

  return { ...query, certificates: query.data ?? [], issue };
};
