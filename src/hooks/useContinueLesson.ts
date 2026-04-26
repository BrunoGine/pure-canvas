import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ContinueLesson {
  lesson_id: string;
  lesson_title: string;
  course_id: string;
  course_title: string;
  course_color: string;
  course_icon: string;
  progress_pct: number;
  updated_at: string;
}

export const useContinueLesson = () => {
  const { user } = useAuth();

  return useQuery<ContinueLesson | null>({
    queryKey: ["continue_lesson", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data: progress, error } = await (supabase as any)
        .from("user_progress")
        .select("lesson_id, video_watched, summary_read, questions_passed, completed, updated_at")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("updated_at", { ascending: false })
        .limit(1);
      if (error) throw error;
      const last = (progress ?? [])[0];
      if (!last) return null;

      const { data: lesson } = await (supabase as any)
        .from("lessons")
        .select("id, title, course_id")
        .eq("id", last.lesson_id)
        .maybeSingle();
      if (!lesson) return null;

      const { data: course } = await (supabase as any)
        .from("courses")
        .select("id, title, color, icon")
        .eq("id", lesson.course_id)
        .maybeSingle();

      const steps = [last.video_watched, last.summary_read, last.questions_passed];
      const done = steps.filter(Boolean).length;
      const pct = Math.round((done / 3) * 100);

      return {
        lesson_id: lesson.id,
        lesson_title: lesson.title,
        course_id: lesson.course_id,
        course_title: course?.title ?? "Curso",
        course_color: course?.color ?? "#8A05BE",
        course_icon: course?.icon ?? "BookOpen",
        progress_pct: pct,
        updated_at: last.updated_at,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};
