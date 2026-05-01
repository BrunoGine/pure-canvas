import {
  Plane,
  Home,
  Car,
  Gift,
  GraduationCap,
  Heart,
  Laptop,
  Palmtree,
  PiggyBank,
  HeartPulse,
  PawPrint,
  Target,
  type LucideIcon,
} from "lucide-react";

export interface GoalPreset {
  key: string;
  label: string;
  icon: LucideIcon;
  /** Tailwind gradient stops (used with `bg-gradient-to-br`). */
  gradient: string;
}

export const GOAL_PRESETS: GoalPreset[] = [
  { key: "travel",  label: "Viagem",     icon: Plane,         gradient: "from-sky-500 to-blue-700" },
  { key: "house",   label: "Casa",       icon: Home,          gradient: "from-amber-500 to-orange-700" },
  { key: "car",     label: "Carro",      icon: Car,           gradient: "from-red-500 to-rose-700" },
  { key: "gift",    label: "Presente",   icon: Gift,          gradient: "from-pink-500 to-fuchsia-700" },
  { key: "study",   label: "Estudos",    icon: GraduationCap, gradient: "from-violet-500 to-purple-700" },
  { key: "wedding", label: "Casamento",  icon: Heart,         gradient: "from-rose-400 to-red-600" },
  { key: "tech",    label: "Eletrônico", icon: Laptop,        gradient: "from-slate-500 to-zinc-700" },
  { key: "beach",   label: "Férias",     icon: Palmtree,      gradient: "from-teal-400 to-cyan-700" },
  { key: "reserve", label: "Reserva",    icon: PiggyBank,     gradient: "from-emerald-500 to-green-700" },
  { key: "health",  label: "Saúde",      icon: HeartPulse,    gradient: "from-red-400 to-pink-600" },
  { key: "pet",     label: "Pet",        icon: PawPrint,      gradient: "from-yellow-500 to-amber-700" },
  { key: "other",   label: "Outro",      icon: Target,        gradient: "from-primary to-purple-700" },
];

export const DEFAULT_PRESET = GOAL_PRESETS[GOAL_PRESETS.length - 1];

/**
 * Resolves a goal's `image_url` into a preset.
 * Format used: "preset:<key>". Anything else (legacy URL, null) → default preset.
 */
export function getGoalPreset(image_url: string | null | undefined): GoalPreset {
  if (!image_url || !image_url.startsWith("preset:")) return DEFAULT_PRESET;
  const key = image_url.slice("preset:".length);
  return GOAL_PRESETS.find((p) => p.key === key) ?? DEFAULT_PRESET;
}

export const presetToImageUrl = (key: string) => `preset:${key}`;
