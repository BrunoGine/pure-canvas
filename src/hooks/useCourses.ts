import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Course {
  id: string;
  title: string;
  description: string | null;
  level: string;
  order: number;
  icon: string;
  color: string;
}

export interface CourseWithProgress extends Course {
  total_lessons: number;
  completed_lessons: number;
}

export const useCourses = () => {
  const { user } = useAuth();
  return useQuery<CourseWithProgress[]>({
    queryKey: ["courses", user?.id],
    queryFn: async () => {
      const { data: courses, error } = await (supabase as any)
        .from("courses")
        .select("*")
        .order("order", { ascending: true });
      if (error) throw error;

      const { data: lessons } = await (supabase as any).from("lessons").select("id, course_id");
      const { data: progress } = user
        ? await (supabase as any)
            .from("user_progress")
            .select("lesson_id, completed")
            .eq("user_id", user.id)
            .eq("completed", true)
        : { data: [] as any[] };

      const completedSet = new Set((progress ?? []).map((p: any) => p.lesson_id));

      return (courses as Course[]).map((c) => {
        const courseLessons = (lessons ?? []).filter((l: any) => l.course_id === c.id);
        return {
          ...c,
          total_lessons: courseLessons.length,
          completed_lessons: courseLessons.filter((l: any) => completedSet.has(l.id)).length,
        };
      });
    },
    staleTime: 5 * 60_000,
  });
};
