// Lightweight Spaced-Repetition (SM-lite) — 100% local, no schema, no IA.
// Stages map to delays: 1d, 3d, 7d, 15d (cap at 15d). Score < 70 resets to stage 0.

const KEY = "spaced_reviews_v1";

export interface ReviewEntry {
  stage: number;       // 0..3
  dueAt: number;       // ms epoch
  lastScore: number;
  attempts: number;
  updatedAt: number;
}

const DAY = 24 * 60 * 60 * 1000;
const STAGE_DELAYS = [1 * DAY, 3 * DAY, 7 * DAY, 15 * DAY];

const read = (): Record<string, ReviewEntry> => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    return {};
  }
};

const write = (data: Record<string, ReviewEntry>) => {
  try { localStorage.setItem(KEY, JSON.stringify(data)); } catch {}
};

export const scheduleReview = (lessonId: string, score: number) => {
  if (!lessonId) return;
  const all = read();
  const prev = all[lessonId];
  const passing = score >= 70;
  const stage = !prev ? (passing ? 0 : 0) : passing ? Math.min(STAGE_DELAYS.length - 1, prev.stage + 1) : 0;
  const delay = STAGE_DELAYS[stage];
  all[lessonId] = {
    stage,
    dueAt: Date.now() + delay,
    lastScore: score,
    attempts: (prev?.attempts ?? 0) + 1,
    updatedAt: Date.now(),
  };
  write(all);
};

export const markReviewedNow = (lessonId: string, score: number) => scheduleReview(lessonId, score);

export const removeReview = (lessonId: string) => {
  const all = read();
  delete all[lessonId];
  write(all);
};

export interface DueReview { lessonId: string; entry: ReviewEntry; overdueDays: number }

export const getDueReviews = (now = Date.now()): DueReview[] => {
  const all = read();
  return Object.entries(all)
    .filter(([, v]) => v.dueAt <= now)
    .map(([lessonId, entry]) => ({
      lessonId,
      entry,
      overdueDays: Math.max(0, Math.floor((now - entry.dueAt) / DAY)),
    }))
    .sort((a, b) => a.entry.dueAt - b.entry.dueAt);
};

export const getUpcomingReviews = (days = 3, now = Date.now()): DueReview[] => {
  const horizon = now + days * DAY;
  const all = read();
  return Object.entries(all)
    .filter(([, v]) => v.dueAt > now && v.dueAt <= horizon)
    .map(([lessonId, entry]) => ({ lessonId, entry, overdueDays: 0 }))
    .sort((a, b) => a.entry.dueAt - b.entry.dueAt);
};

export const getAllReviews = () => Object.entries(read()).map(([lessonId, entry]) => ({ lessonId, entry }));
