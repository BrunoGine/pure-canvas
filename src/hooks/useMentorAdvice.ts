import { useUserStats } from "./useUserStats";
import { useContinueLesson } from "./useContinueLesson";
import { useMemo } from "react";

export interface MentorAdvice {
  message: string;
  tone: "info" | "warning" | "success";
  cta?: { label: string; action: "continue" | "chat" | "exam" };
}

/**
 * Mentor por regras locais. Sem chamadas de IA por padrão.
 */
export const useMentorAdvice = (): MentorAdvice => {
  const { data: stats } = useUserStats();
  const { data: cont } = useContinueLesson();

  return useMemo(() => {
    const xp = stats?.xp ?? 0;
    const streak = stats?.streak ?? 0;
    const today = new Date().toISOString().slice(0, 10);
    const lastActive = stats?.last_activity_date;

    // 1. checa última tentativa de quiz com baixa pontuação
    try {
      let worstKey: string | null = null;
      let worstScore = 101;
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (!k?.startsWith("lesson_attempts_")) continue;
        const raw = localStorage.getItem(k);
        if (!raw) continue;
        const v = JSON.parse(raw);
        if (typeof v?.lastScore === "number" && v.lastScore < 60 && v.lastScore < worstScore) {
          worstScore = v.lastScore;
          worstKey = k;
        }
      }
      if (worstKey) {
        return {
          message: `Você teve dificuldade num quiz recente (${worstScore}%). Recomendo revisar essa aula antes de avançar.`,
          tone: "warning",
          cta: { label: "Pedir conselho ao Harp", action: "chat" },
        };
      }
    } catch {}

    if (lastActive !== today && cont) {
      return {
        message: `Continue de onde parou em "${cont.lesson_title}". Cada dia conta para manter sua ofensiva.`,
        tone: "info",
        cta: { label: "Continuar agora", action: "continue" },
      };
    }

    if (streak >= 7) {
      return {
        message: `Você está com ${streak} dias de ofensiva — consistência é o que cria resultado de verdade. Continue assim!`,
        tone: "success",
        cta: { label: "Treino para Prova", action: "exam" },
      };
    }

    if (xp >= 500 && xp < 1000) {
      return {
        message: `Faltam só ${1000 - xp} XP para a conquista "Lenda em Ascensão". Bora?`,
        tone: "info",
        cta: { label: "Continuar estudando", action: "continue" },
      };
    }

    return {
      message: "Comece uma aula hoje — a primeira aula concluída já te dá uma conquista.",
      tone: "info",
      cta: { label: "Ver trilhas", action: "continue" },
    };
  }, [stats, cont]);
};
