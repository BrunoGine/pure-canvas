import { useEffect, useRef, useState, useCallback } from "react";
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

const isSameSubscription = (a: SubscriptionRecord | null, b: SubscriptionRecord | null) =>
  a?.plan === b?.plan &&
  a?.status === b?.status &&
  a?.trial_started_at === b?.trial_started_at &&
  a?.trial_ends_at === b?.trial_ends_at &&
  a?.current_period_end === b?.current_period_end &&
  a?.cancel_at_period_end === b?.cancel_at_period_end &&
  a?.billing_interval === b?.billing_interval;

let subscriptionChannelInstance = 0;

export function useSubscription(): UseSubscriptionResult {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const channelInstanceRef = useRef<string>("");

  if (!channelInstanceRef.current) {
    subscriptionChannelInstance += 1;
    channelInstanceRef.current = String(subscriptionChannelInstance);
  }

  const fetchSub = useCallback(async () => {
    if (!user?.id) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("subscriptions")
      .select(
        "plan,status,trial_started_at,trial_ends_at,current_period_end,cancel_at_period_end,billing_interval"
      )
      .eq("user_id", user.id)
      .maybeSingle();
    const next = (data as SubscriptionRecord | null) ?? null;
    setSubscription((current) => (isSameSubscription(current, next) ? current : next));
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase.channel(`subscriptions:${user.id}:${channelInstanceRef.current}`);
    channel
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchSub()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, fetchSub]);

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
