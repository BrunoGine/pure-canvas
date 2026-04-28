// Daily missions — 100% local, picked once per day, idempotent.

export type MissionKey = "watch_lesson" | "complete_training" | "review_one" | "quiz_pass";

export interface MissionDef {
  key: MissionKey;
  title: string;
  description: string;
  goal: number;
  xp: number;
}

export const MISSION_CATALOG: Record<MissionKey, MissionDef> = {
  watch_lesson:      { key: "watch_lesson",      title: "Assista uma aula",      description: "Avance em qualquer mundo",        goal: 1, xp: 20 },
  complete_training: { key: "complete_training", title: "Treino rápido",         description: "Conclua um treino de 5 questões", goal: 1, xp: 25 },
  review_one:        { key: "review_one",        title: "Revisão pendente",      description: "Refaça uma aula da fila",          goal: 1, xp: 25 },
  quiz_pass:         { key: "quiz_pass",         title: "Passe em um quiz",      description: "Acerte 60% ou mais",               goal: 1, xp: 20 },
};

export const ALL_KEYS = Object.keys(MISSION_CATALOG) as MissionKey[];

export interface DailyState {
  date: string; // YYYY-MM-DD
  picked: MissionKey[];
  progress: Partial<Record<MissionKey, number>>;
  claimed: Partial<Record<MissionKey, boolean>>;
  bonusClaimed: boolean;
}

const today = () => new Date().toISOString().slice(0, 10);
const STORAGE_PREFIX = "daily_missions_";

const cleanupOld = () => {
  try {
    const t = today();
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k?.startsWith(STORAGE_PREFIX) && !k.endsWith(t)) localStorage.removeItem(k);
    }
  } catch {}
};

const seededShuffle = (arr: MissionKey[], seed: string): MissionKey[] => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    h = (h * 1103515245 + 12345) & 0x7fffffff;
    const j = h % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
};

export const loadDailyState = (userId?: string | null): DailyState => {
  cleanupOld();
  const t = today();
  const key = STORAGE_PREFIX + t;
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  const picked = seededShuffle(ALL_KEYS, `${userId ?? "anon"}-${t}`).slice(0, 3);
  const fresh: DailyState = { date: t, picked, progress: {}, claimed: {}, bonusClaimed: false };
  try { localStorage.setItem(key, JSON.stringify(fresh)); } catch {}
  return fresh;
};

const save = (state: DailyState) => {
  try { localStorage.setItem(STORAGE_PREFIX + state.date, JSON.stringify(state)); } catch {}
};

export const tickMission = (key: MissionKey, userId?: string | null): DailyState => {
  const state = loadDailyState(userId);
  if (!state.picked.includes(key)) return state;
  const goal = MISSION_CATALOG[key].goal;
  const cur = state.progress[key] ?? 0;
  if (cur >= goal) return state;
  state.progress[key] = Math.min(goal, cur + 1);
  save(state);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_PREFIX + state.date }));
  return state;
};

export const claimMission = (key: MissionKey, userId?: string | null): DailyState | null => {
  const state = loadDailyState(userId);
  if (!state.picked.includes(key)) return null;
  if ((state.progress[key] ?? 0) < MISSION_CATALOG[key].goal) return null;
  if (state.claimed[key]) return null;
  state.claimed[key] = true;
  save(state);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_PREFIX + state.date }));
  return state;
};

export const claimDailyBonus = (userId?: string | null): DailyState | null => {
  const state = loadDailyState(userId);
  const allClaimed = state.picked.every((k) => state.claimed[k]);
  if (!allClaimed || state.bonusClaimed) return null;
  state.bonusClaimed = true;
  save(state);
  window.dispatchEvent(new StorageEvent("storage", { key: STORAGE_PREFIX + state.date }));
  return state;
};

export const isAllComplete = (state: DailyState) => state.picked.every((k) => state.claimed[k]);
