import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { FinancialGoal, TracksExpenses } from "@/lib/financialPlan";

export interface FinancialProfile {
  display_name: string | null;
  monthly_income: number | null;
  financial_goal: FinancialGoal | null;
  tracks_expenses: TracksExpenses | null;
  has_emergency_fund: boolean | null;
  onboarding_completed: boolean;
}

export function useFinancialProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<FinancialProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("profiles")
      .select(
        "display_name, monthly_income, financial_goal, tracks_expenses, has_emergency_fund, onboarding_completed",
      )
      .eq("id", user.id)
      .maybeSingle();
    if (data) {
      setProfile({
        display_name: data.display_name,
        monthly_income: data.monthly_income !== null ? Number(data.monthly_income) : null,
        financial_goal: (data.financial_goal as FinancialGoal | null) ?? null,
        tracks_expenses: (data.tracks_expenses as TracksExpenses | null) ?? null,
        has_emergency_fund: data.has_emergency_fund,
        onboarding_completed: !!data.onboarding_completed,
      });
    } else {
      setProfile({
        display_name: null,
        monthly_income: null,
        financial_goal: null,
        tracks_expenses: null,
        has_emergency_fund: null,
        onboarding_completed: false,
      });
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const update = useCallback(
    async (patch: Partial<FinancialProfile>) => {
      if (!user) return;
      const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
      if (!error) {
        setProfile((p) => (p ? { ...p, ...patch } as FinancialProfile : p));
      }
      return error;
    },
    [user],
  );

  return { profile, loading, refresh: fetchProfile, update };
}
