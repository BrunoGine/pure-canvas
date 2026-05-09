import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import NameStep from "@/components/onboarding/steps/NameStep";
import IncomeStep from "@/components/onboarding/steps/IncomeStep";
import GoalStep from "@/components/onboarding/steps/GoalStep";
import TrackingStep from "@/components/onboarding/steps/TrackingStep";
import EmergencyStep from "@/components/onboarding/steps/EmergencyStep";
import PlanReviewStep from "@/components/onboarding/steps/PlanReviewStep";
import {
  generateFinancialPlan,
  type FinancialAnswers,
  type FinancialGoal,
  type TracksExpenses,
} from "@/lib/financialPlan";

const DRAFT_KEY = "onboarding_draft_v1";
const TOTAL_STEPS = 6;

interface Draft {
  name: string;
  monthly_income: number | null;
  financial_goal: FinancialGoal | null;
  tracks_expenses: TracksExpenses | null;
  has_emergency_fund: boolean | null;
}

const empty: Draft = {
  name: "",
  monthly_income: null,
  financial_goal: null,
  tracks_expenses: null,
  has_emergency_fund: null,
};

const OnboardingPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) setDraft({ ...empty, ...JSON.parse(raw) });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }, [draft]);

  const update = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  const back = () => (step === 0 ? null : setStep((s) => s - 1));

  const finish = async (apply: boolean) => {
    if (!user) return;
    setApplying(true);
    try {
      const answers: FinancialAnswers = {
        monthly_income: draft.monthly_income || 0,
        financial_goal: draft.financial_goal!,
        tracks_expenses: draft.tracks_expenses!,
        has_emergency_fund: !!draft.has_emergency_fund,
      };

      // Save profile answers
      const { error: pErr } = await supabase
        .from("profiles")
        .update({
          display_name: draft.name.trim(),
          monthly_income: answers.monthly_income,
          financial_goal: answers.financial_goal,
          tracks_expenses: answers.tracks_expenses,
          has_emergency_fund: answers.has_emergency_fund,
          onboarding_completed: true,
        })
        .eq("id", user.id);
      if (pErr) throw pErr;

      if (apply) {
        const plan = generateFinancialPlan(answers);

        // Create budgets per category (skip if exists)
        const { data: existing } = await supabase
          .from("budgets")
          .select("category")
          .eq("user_id", user.id);
        const existingSet = new Set((existing || []).map((b) => b.category));

        const rows = plan.categories
          .filter((c) => !existingSet.has(c.label) && c.amount > 0)
          .map((c) => ({
            user_id: user.id,
            category: c.label,
            limit_amount: c.amount,
          }));
        if (rows.length) {
          await supabase.from("budgets").insert(rows);
        }

        // Create emergency reserve goal if user has none
        if (!answers.has_emergency_fund) {
          const essentials = plan.categories.find((c) => c.key === "essentials");
          const target = Math.round((essentials?.amount || answers.monthly_income * 0.5) * 6);
          if (target > 0) {
            const { data: goalsExisting } = await supabase
              .from("goals")
              .select("id")
              .eq("user_id", user.id)
              .ilike("name", "%reserva%emergência%");
            if (!goalsExisting || goalsExisting.length === 0) {
              await supabase.from("goals").insert({
                user_id: user.id,
                name: "Reserva de emergência",
                target_amount: target,
              });
            }
          }
        }

        toast.success("Plano aplicado! Bem-vindo(a) 🎉");
      } else {
        toast.success("Tudo pronto! Você pode configurar tudo depois.");
      }

      localStorage.removeItem(DRAFT_KEY);
      // Full reload so ProtectedRoutes re-fetches onboarding_completed=true
      window.location.replace("/");
      return;
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao salvar");
    } finally {
      setApplying(false);
    }
  };

  const answers: FinancialAnswers = {
    monthly_income: draft.monthly_income || 0,
    financial_goal: draft.financial_goal ?? "organize",
    tracks_expenses: draft.tracks_expenses ?? "sometimes",
    has_emergency_fund: !!draft.has_emergency_fund,
  };

  return (
    <OnboardingShell step={step} total={TOTAL_STEPS} onBack={step > 0 ? back : undefined}>
      {step === 0 && (
        <NameStep
          value={draft.name}
          onChange={(v) => update("name", v)}
          onNext={next}
        />
      )}
      {step === 1 && (
        <IncomeStep
          value={draft.monthly_income}
          onChange={(v) => update("monthly_income", v)}
          onNext={next}
        />
      )}
      {step === 2 && (
        <GoalStep
          value={draft.financial_goal}
          onChange={(v) => update("financial_goal", v)}
          onNext={next}
        />
      )}
      {step === 3 && (
        <TrackingStep
          value={draft.tracks_expenses}
          onChange={(v) => update("tracks_expenses", v)}
          onNext={next}
        />
      )}
      {step === 4 && (
        <EmergencyStep
          value={draft.has_emergency_fund}
          onChange={(v) => update("has_emergency_fund", v)}
          onNext={next}
        />
      )}
      {step === 5 && (
        <PlanReviewStep
          answers={answers}
          loading={applying}
          onApply={() => finish(true)}
          onSkip={() => finish(false)}
        />
      )}
    </OnboardingShell>
  );
};

export default OnboardingPage;
