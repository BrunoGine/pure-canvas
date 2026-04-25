import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const extractVideoId = (url: string): string | null => {
  if (!url) return null;
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/);
  return m ? m[1] : null;
};

export interface CourseInput {
  id?: string;
  title: string;
  description?: string;
  level: string;
  order: number;
  color: string;
  icon: string;
}

export interface LessonInput {
  id?: string;
  course_id: string;
  title: string;
  subtitle?: string;
  youtube_url: string;
  video_credit?: string | null;
  order: number;
  xp_reward: number;
  summary?: string | null;
  questions?: any | null;
}

export const useAdminMutations = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const invalidateAll = async (courseId?: string) => {
    await Promise.all([
      qc.refetchQueries({ queryKey: ["courses"], type: "all" }),
      qc.refetchQueries({ queryKey: ["course_lessons"], type: "all" }),
      qc.refetchQueries({ queryKey: ["lesson"], type: "all" }),
    ]);
    if (courseId) {
      await qc.refetchQueries({ queryKey: ["course_lessons", courseId], type: "all" });
    }
  };

  const saveCourse = useMutation({
    mutationFn: async (input: CourseInput) => {
      const { id, ...payload } = input;
      if (id) {
        const { error } = await (supabase as any).from("courses").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("courses").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async (_, input) => {
      toast({ title: input.id ? "Mundo atualizado" : "Mundo criado" });
      await invalidateAll();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast({ title: "Mundo excluído" });
      await invalidateAll();
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const saveLesson = useMutation({
    mutationFn: async (input: LessonInput) => {
      const vid = extractVideoId(input.youtube_url);
      if (!vid) throw new Error("URL do YouTube inválida");
      const { id, ...rest } = input;
      const payload: any = {
        ...rest,
        youtube_video_id: vid,
        video_credit: rest.video_credit || null,
        summary: rest.summary || null,
        questions: rest.questions ?? null,
      };
      if (id) {
        const { error } = await (supabase as any).from("lessons").update(payload).eq("id", id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from("lessons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: async (_, input) => {
      toast({ title: input.id ? "Aula atualizada" : "Aula criada" });
      await invalidateAll(input.course_id);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteLesson = useMutation({
    mutationFn: async ({ id }: { id: string; course_id: string }) => {
      const { error } = await (supabase as any).from("lessons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_, { course_id }) => {
      toast({ title: "Aula excluída" });
      await invalidateAll(course_id);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  // Swap order between two lessons
  const swapLessonOrder = useMutation({
    mutationFn: async ({ a, b }: { a: { id: string; order: number }; b: { id: string; order: number }; course_id: string }) => {
      // Use a temp value to avoid unique conflicts if any constraint exists
      const tempOrder = -Math.floor(Math.random() * 1_000_000) - 1;
      const { error: e1 } = await (supabase as any).from("lessons").update({ order: tempOrder }).eq("id", a.id);
      if (e1) throw e1;
      const { error: e2 } = await (supabase as any).from("lessons").update({ order: a.order }).eq("id", b.id);
      if (e2) throw e2;
      const { error: e3 } = await (supabase as any).from("lessons").update({ order: b.order }).eq("id", a.id);
      if (e3) throw e3;
    },
    onSuccess: (_, { course_id }) => {
      invalidateAll(course_id);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const generateAiContent = useMutation({
    mutationFn: async (lessonId: string) => {
      const { data, error } = await supabase.functions.invoke("generate-lesson-content", {
        body: { lesson_id: lessonId, force: true },
      });
      if (error) throw error;
      return data as { summary: string | null; questions: any };
    },
    onError: (e: any) => toast({ title: "Erro IA", description: e.message, variant: "destructive" }),
  });

  return { saveCourse, deleteCourse, saveLesson, deleteLesson, swapLessonOrder, generateAiContent };
};
