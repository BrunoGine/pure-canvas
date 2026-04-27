import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface MentorAdvice {
  message: string;
  tone: "encourage" | "review" | "celebrate" | "default";
  cta?: { label: string; lessonId?: string; courseId?: string };
}

/**
 * Local rule-based mentor advice (no AI calls).
 * Looks at user_stats, progress and recent lesson scores.
 */
export const useMentorAdvice = () => {
  const { user } = useAuth();
  return useQuery<MentorAdvice>({
    queryKey: ["mentor_advice", user?.id],
    queryFn: async (): Promise<MentorAdvice> => {
      if (!user) {
        return { message: "Faça login para destravar dicas personalizadas.", tone: "default" };
      }

      const { data: stats } = await (supabase as any)
        .from("user_stats")
        .select("streak, level, xp")
        .eq("user_id", user.id)
        .maybeSingle();

      // Streak == 0 → encourage
      if (!stats || (stats.streak ?? 0) === 0) {
        return {
          message: "Sua ofensiva está zerada. Que tal assistir uma aula curta hoje para começar de novo?",
          tone: "encourage",
        };
      }

      // Latest progress with low score → review
      const { data: lowScores } = await (supabase as any)
        .from("user_progress")
        .select("lesson_id, score, completed, updated_at")
        .eq("user_id", user.id)
        .lt("score", 70)
        .gt("score", 0)
        .order("updated_at", { ascending: false })
        .limit(1);

      if (lowScores?.[0]) {
        const { data: lesson } = await (supabase as any)
          .from("lessons")
          .select("id, title, course_id")
          .eq("id", lowScores[0].lesson_id)
          .maybeSingle();
        if (lesson) {
          return {
            message: `Sua nota em "${lesson.title}" foi baixa. Vale revisar antes de avançar.`,
            tone: "review",
            cta: { label: "Revisar aula", lessonId: lesson.id },
          };
        }
      }

      // Course near completion (≥80%) → celebrate
      const { data: courses } = await (supabase as any)
        .from("courses")
        .select("id, title");
      if (courses?.length) {
        for (const c of courses) {
          const { data: lessons } = await (supabase as any)
            .from("lessons")
            .select("id")
            .eq("course_id", c.id);
          const ids = (lessons ?? []).map((l: any) => l.id);
          if (ids.length === 0) continue;
          const { data: progress } = await (supabase as any)
            .from("user_progress")
            .select("lesson_id, completed")
            .eq("user_id", user.id)
            .in("lesson_id", ids);
          const done = (progress ?? []).filter((p: any) => p.completed).length;
          const pct = done / ids.length;
          if (pct >= 0.8 && pct < 1) {
            return {
              message: `Você está a ${ids.length - done} aula(s) de concluir "${c.title}" e ganhar seu certificado!`,
              tone: "celebrate",
              cta: { label: "Continuar mundo", courseId: c.id },
            };
          }
        }
      }

      return {
        message: "Bom ritmo! Que tal um treino rápido para fixar o conteúdo?",
        tone: "default",
      };
    },
    enabled: !!user,
    staleTime: 60_000,
  });
};
