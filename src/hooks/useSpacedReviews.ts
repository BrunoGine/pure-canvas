import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { getDueReviews, getUpcomingReviews, type DueReview } from "@/lib/spacedReview";

export interface ReviewWithLesson extends DueReview {
  lesson: { id: string; title: string; subtitle: string | null; course_id: string } | null;
  course: { id: string; title: string; color: string; icon: string } | null;
}

const enrich = async (items: DueReview[]): Promise<ReviewWithLesson[]> => {
  if (items.length === 0) return [];
  const ids = items.map((i) => i.lessonId);
  const { data: lessons } = await (supabase as any)
    .from("lessons")
    .select("id, title, subtitle, course_id")
    .in("id", ids);
  const lessonMap = new Map((lessons ?? []).map((l: any) => [l.id, l]));
  const courseIds = Array.from(new Set((lessons ?? []).map((l: any) => l.course_id)));
  const { data: courses } = courseIds.length
    ? await (supabase as any).from("courses").select("id, title, color, icon").in("id", courseIds)
    : { data: [] };
  const courseMap = new Map((courses ?? []).map((c: any) => [c.id, c]));
  return items
    .map((it) => {
      const l = lessonMap.get(it.lessonId) as any;
      return {
        ...it,
        lesson: l ?? null,
        course: l ? (courseMap.get(l.course_id) as any) ?? null : null,
      };
    })
    .filter((it) => it.lesson); // drop deleted lessons
};

export const useSpacedReviews = () => {
  const { user } = useAuth();
  const qc = useQueryClient();

  // Refresh on cross-tab change
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "spaced_reviews_v1") {
        qc.invalidateQueries({ queryKey: ["spaced_reviews", user?.id] });
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [qc, user?.id]);

  return useQuery({
    queryKey: ["spaced_reviews", user?.id],
    queryFn: async () => {
      const due = await enrich(getDueReviews());
      const upcoming = await enrich(getUpcomingReviews(3));
      return { due, upcoming };
    },
    staleTime: 60_000,
    enabled: !!user,
  });
};

export const invalidateSpacedReviews = (qc: ReturnType<typeof useQueryClient>) =>
  qc.invalidateQueries({ queryKey: ["spaced_reviews"] });
