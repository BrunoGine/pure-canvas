import { Award, Calendar, Flame, GraduationCap, Sparkles, Star, Trophy, Zap, type LucideIcon } from "lucide-react";

export interface BadgeDef {
  key: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string; // hex
}

export const BADGES: Record<string, BadgeDef> = {
  first_lesson: {
    key: "first_lesson",
    title: "Primeira Aula",
    description: "Concluiu sua primeira aula",
    icon: Sparkles,
    color: "#8A05BE",
  },
  world_complete: {
    key: "world_complete",
    title: "Mundo Conquistado",
    description: "Concluiu um mundo inteiro",
    icon: Trophy,
    color: "#F59E0B",
  },
  streak_7: {
    key: "streak_7",
    title: "7 Dias de Foco",
    description: "Manteve uma ofensiva de 7 dias",
    icon: Flame,
    color: "#F97316",
  },
  streak_30: {
    key: "streak_30",
    title: "Disciplina de Aço",
    description: "30 dias de ofensiva ativa",
    icon: Flame,
    color: "#DC2626",
  },
  level_5: {
    key: "level_5",
    title: "Nível 5",
    description: "Alcançou o nível 5",
    icon: Zap,
    color: "#3B82F6",
  },
  level_10: {
    key: "level_10",
    title: "Nível 10",
    description: "Alcançou o nível 10",
    icon: Star,
    color: "#06B6D4",
  },
  scholar: {
    key: "scholar",
    title: "Estudioso",
    description: "Concluiu 10 aulas",
    icon: GraduationCap,
    color: "#10B981",
  },
  certified: {
    key: "certified",
    title: "Certificado",
    description: "Recebeu seu primeiro certificado",
    icon: Award,
    color: "#EC4899",
  },
  daily_complete: {
    key: "daily_complete",
    title: "Dia Completo",
    description: "Concluiu todas as missões do dia",
    icon: Calendar,
    color: "#FACC15",
  },
};

export const ALL_BADGE_KEYS = Object.keys(BADGES);
