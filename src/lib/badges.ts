import { Award, Flame, Zap, BookOpen, Globe2, Trophy, type LucideIcon } from "lucide-react";

export interface BadgeDef {
  key: string;
  name: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

export const BADGES: BadgeDef[] = [
  {
    key: "first_lesson",
    name: "Primeiros Passos",
    description: "Conclua sua primeira aula",
    icon: BookOpen,
    color: "#3B82F6",
  },
  {
    key: "streak_7",
    name: "Semana de Fogo",
    description: "Mantenha 7 dias de ofensiva",
    icon: Flame,
    color: "#F97316",
  },
  {
    key: "streak_30",
    name: "Disciplina de Aço",
    description: "Mantenha 30 dias de ofensiva",
    icon: Flame,
    color: "#DC2626",
  },
  {
    key: "answers_50",
    name: "Mente Afiada",
    description: "Responda 50 perguntas",
    icon: Zap,
    color: "#A855F7",
  },
  {
    key: "first_world",
    name: "Conquistador",
    description: "Conclua seu primeiro mundo",
    icon: Globe2,
    color: "#10B981",
  },
  {
    key: "xp_1000",
    name: "Lenda em Ascensão",
    description: "Alcance 1000 XP",
    icon: Trophy,
    color: "#F59E0B",
  },
];

export const BADGE_MAP = Object.fromEntries(BADGES.map(b => [b.key, b]));

export const getBadge = (key: string): BadgeDef => BADGE_MAP[key] ?? {
  key,
  name: key,
  description: "",
  icon: Award,
  color: "#8A05BE",
};
