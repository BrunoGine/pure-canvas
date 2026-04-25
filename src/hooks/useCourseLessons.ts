import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  subtitle: string | null;
  youtube_url: string;
  youtube_video_id: string | null;
  order: number;
  xp_reward: number;
  summary: string | null;
  questions: any | null;
  video_credit: string | null;
}

export interface LessonWithProgress extends Lesson {
  completed: boolean;
  unlocked: boolean;
}

export const useCourseLessons = (courseId: string | undefined) => {
  const { user } = useAuth();
  return useQuery<{ course: any; lessons: LessonWithProgress[] }>({
    queryKey: ["course_lessons", courseId, user?.id],
    queryFn: async () => {
      if (!courseId) throw new Error("missing courseId");
      const { data: course } = await (supabase as any)
        .from("courses")
        .select("*")
        .eq("id", courseId)
        .maybeSingle();

      const { data: lessons, error } = await (supabase as any)
        .from("lessons")
        .select("*")
        .eq("course_id", courseId)
        .order("order", { ascending: true });
      if (error) throw error;

      const lessonIds = (lessons ?? []).map((l: any) => l.id);
      const { data: progress } = user && lessonIds.length
        ? await (supabase as any)
            .from("user_progress")
            .select("lesson_id, completed")
            .eq("user_id", user.id)
            .in("lesson_id", lessonIds)
        : { data: [] as any[] };

      const completedSet = new Set((progress ?? []).filter((p: any) => p.completed).map((p: any) => p.lesson_id));

      let unlockNext = true;
      const withProgress: LessonWithProgress[] = (lessons as Lesson[]).map((l) => {
        const completed = completedSet.has(l.id);
        const unlocked = unlockNext;
        if (!completed) unlockNext = false;
        return { ...l, completed, unlocked };
      });

      return { course, lessons: withProgress };
    },
    enabled: !!courseId,
    staleTime: 0,
  });
};
