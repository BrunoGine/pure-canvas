import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface LessonProgress {
  id?: string;
  user_id: string;
  lesson_id: string;
  completed: boolean;
  score: number;
  video_watched: boolean;
  summary_read: boolean;
  questions_passed: boolean;
  completed_at: string | null;
}

export const useLessonProgress = (lessonId: string | undefined) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const query = useQuery<LessonProgress | null>({
    queryKey: ["lesson_progress", lessonId, user?.id],
    queryFn: async () => {
      if (!user || !lessonId) return null;
      const { data, error } = await (supabase as any)
        .from("user_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("lesson_id", lessonId)
        .maybeSingle();
      if (error) throw error;
      return data as LessonProgress | null;
    },
    enabled: !!user && !!lessonId,
  });

  const upsert = useMutation({
    mutationFn: async (patch: Partial<LessonProgress>) => {
      if (!user || !lessonId) return null;
      const payload = {
        user_id: user.id,
        lesson_id: lessonId,
        ...query.data,
        ...patch,
      };
      delete (payload as any).id;
      delete (payload as any).created_at;
      delete (payload as any).updated_at;
      const { data, error } = await (supabase as any)
        .from("user_progress")
        .upsert(payload, { onConflict: "user_id,lesson_id" })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson_progress", lessonId, user?.id] });
      qc.invalidateQueries({ queryKey: ["course_lessons"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
    },
  });

  return { ...query, upsert };
};
