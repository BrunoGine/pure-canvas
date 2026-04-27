import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ContinueData {
  lesson: { id: string; title: string; subtitle: string | null; course_id: string } | null;
  course: { id: string; title: string; color: string; icon: string } | null;
  progressPct: number;
  totalLessons: number;
  completedLessons: number;
  status: "in_progress" | "next" | "empty";
}

export const useContinueLesson = () => {
  const { user } = useAuth();
  return useQuery<ContinueData>({
    queryKey: ["continue_lesson", user?.id],
    queryFn: async (): Promise<ContinueData> => {
      if (!user) {
        return { lesson: null, course: null, progressPct: 0, totalLessons: 0, completedLessons: 0, status: "empty" };
      }

      // 1. Find most recently updated incomplete progress
      const { data: incomplete } = await (supabase as any)
        .from("user_progress")
        .select("lesson_id, updated_at, video_watched, summary_read, score")
        .eq("user_id", user.id)
        .eq("completed", false)
        .order("updated_at", { ascending: false })
        .limit(1);

      let targetLessonId: string | null = incomplete?.[0]?.lesson_id ?? null;
      let status: ContinueData["status"] = "in_progress";

      // 2. Otherwise find next lesson after the most recently completed
      if (!targetLessonId) {
        const { data: lastCompleted } = await (supabase as any)
          .from("user_progress")
          .select("lesson_id, updated_at")
          .eq("user_id", user.id)
          .eq("completed", true)
          .order("updated_at", { ascending: false })
          .limit(1);

        if (lastCompleted?.[0]) {
          const { data: lastLesson } = await (supabase as any)
            .from("lessons")
            .select("course_id, order")
            .eq("id", lastCompleted[0].lesson_id)
            .maybeSingle();

          if (lastLesson) {
            const { data: nextLesson } = await (supabase as any)
              .from("lessons")
              .select("id")
              .eq("course_id", lastLesson.course_id)
              .gt("order", lastLesson.order)
              .order("order", { ascending: true })
              .limit(1);
            targetLessonId = nextLesson?.[0]?.id ?? null;
            status = "next";
          }
        }
      }

      if (!targetLessonId) {
        return { lesson: null, course: null, progressPct: 0, totalLessons: 0, completedLessons: 0, status: "empty" };
      }

      const { data: lesson } = await (supabase as any)
        .from("lessons")
        .select("id, title, subtitle, course_id")
        .eq("id", targetLessonId)
        .maybeSingle();

      if (!lesson) {
        return { lesson: null, course: null, progressPct: 0, totalLessons: 0, completedLessons: 0, status: "empty" };
      }

      const { data: course } = await (supabase as any)
        .from("courses")
        .select("id, title, color, icon")
        .eq("id", lesson.course_id)
        .maybeSingle();

      // Compute progress for this course
      const { data: courseLessons } = await (supabase as any)
        .from("lessons")
        .select("id")
        .eq("course_id", lesson.course_id);

      const ids: string[] = (courseLessons ?? []).map((l: any) => l.id);
      const { data: progress } = ids.length
        ? await (supabase as any)
            .from("user_progress")
            .select("lesson_id, completed")
            .eq("user_id", user.id)
            .in("lesson_id", ids)
        : { data: [] };

      const completed = (progress ?? []).filter((p: any) => p.completed).length;
      const total = ids.length;
      const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        lesson,
        course,
        progressPct: pct,
        totalLessons: total,
        completedLessons: completed,
        status,
      };
    },
    enabled: !!user,
    staleTime: 30_000,
  });
};
