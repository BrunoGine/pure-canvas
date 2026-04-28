import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Question } from "@/components/courses/quiz/QuestionsStep";

export interface QuestionBankItem extends Question {
  source_lesson_id: string;
  source_course_id: string;
  source_topic: string;
  lesson_title: string;
}

interface Args {
  scope: "all" | string; // course_id or "all"
}

export const useQuestionBank = ({ scope }: Args) => {
  return useQuery<QuestionBankItem[]>({
    queryKey: ["question_bank", scope],
    queryFn: async () => {
      let q = (supabase as any)
        .from("lessons")
        .select("id, title, course_id, questions");
      if (scope !== "all") q = q.eq("course_id", scope);
      const { data: lessons, error } = await q;
      if (error) throw error;

      const courseIds = Array.from(new Set((lessons ?? []).map((l: any) => l.course_id)));
      const { data: courses } = courseIds.length
        ? await (supabase as any).from("courses").select("id, title").in("id", courseIds)
        : { data: [] };
      const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c.title as string]));

      const out: QuestionBankItem[] = [];
      for (const l of lessons ?? []) {
        const qs = (l.questions ?? []) as Question[];
        if (!Array.isArray(qs)) continue;
        for (const q of qs) {
          if (!q || !q.question) continue;
          out.push({
            ...q,
            source_lesson_id: l.id,
            source_course_id: l.course_id,
            source_topic: (courseMap.get(l.course_id) as string) ?? "Geral",
            lesson_title: l.title,
          });
        }
      }
      return out;
    },
    staleTime: 5 * 60_000,
  });
};

export const sampleQuestions = (pool: QuestionBankItem[], n: number, seed = Date.now()): QuestionBankItem[] => {
  const arr = [...pool];
  // Fisher-Yates with seeded RNG
  let s = seed;
  const rand = () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(n, arr.length));
};

export interface ErrorEntry {
  lessonId: string;
  question: string;
}

/** Read recent wrong-answer questions from localStorage (lesson_attempts_*). */
export const getRecentWrongQuestions = (): ErrorEntry[] => {
  const out: ErrorEntry[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (!k?.startsWith("lesson_attempts_")) continue;
      const lessonId = k.replace("lesson_attempts_", "");
      const raw = localStorage.getItem(k);
      if (!raw) continue;
      const parsed = JSON.parse(raw);
      const results: any[] = parsed?.lastResults ?? [];
      for (const r of results) {
        if (r && r.isCorrect === false && r.question) out.push({ lessonId, question: r.question });
      }
    }
  } catch {}
  return out;
};
