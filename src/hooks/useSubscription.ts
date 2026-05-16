import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  type Feature,
  type PlanKey,
  type SubscriptionRecord,
  getEffectivePlan,
  hasFeature,
} from "@/lib/plans";

interface UseSubscriptionResult {
  subscription: SubscriptionRecord | null;
  plan: PlanKey;
  effectivePlan: PlanKey;
  isTrialing: boolean;
  trialDaysLeft: number;
  isPremium: boolean;
  isEnterprise: boolean;
  isFree: boolean;
  loading: boolean;
  can: (feature: Feature) => boolean;
  refresh: () => Promise<void>;
}

export function useSubscription(): UseSubscriptionResult {
  const { session } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSub = useCallback(async () => {
    if (!session?.user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "plan,status,trial_started_at,trial_ends_at,current_period_end,cancel_at_period_end,billing_interval"
      )
      .eq("user_id", session.user.id)
      .maybeSingle();
    setSubscription((data as SubscriptionRecord | null) ?? null);
    setLoading(false);
  }, [session?.user?.id]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  useEffect(() => {
    if (!session?.user?.id) return;
    const channel = supabase
      .channel(`subscriptions:${session.user.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => fetchSub()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, fetchSub]);

  const effectivePlan = getEffectivePlan(subscription);
  const isTrialing =
    subscription?.status === "trialing" &&
    !!subscription.trial_ends_at &&
    new Date(subscription.trial_ends_at).getTime() > Date.now();

  const trialDaysLeft = isTrialing
    ? Math.max(
        0,
        Math.ceil(
          (new Date(subscription!.trial_ends_at!).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24)
        )
      )
    : 0;

  return {
    subscription,
    plan: subscription?.plan ?? "free",
    effectivePlan,
    isTrialing,
    trialDaysLeft,
    isPremium: effectivePlan === "premium",
    isEnterprise: effectivePlan === "enterprise",
    isFree: effectivePlan === "free",
    loading,
    can: (feature: Feature) => hasFeature(effectivePlan, feature),
    refresh: fetchSub,
  };
}
