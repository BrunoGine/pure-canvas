import { useState } from "react";
import { motion } from "framer-motion";
import { Pencil, Wallet, Target, Eye, ShieldCheck, Sparkles, RefreshCw } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useFinancialProfile } from "@/hooks/useFinancialProfile";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  GOAL_LABELS,
  TRACKS_LABELS,
  generateFinancialPlan,
  type FinancialAnswers,
  type FinancialGoal,
  type TracksExpenses,
} from "@/lib/financialPlan";
import IncomeStep from "@/components/onboarding/steps/IncomeStep";
import GoalStep from "@/components/onboarding/steps/GoalStep";
import TrackingStep from "@/components/onboarding/steps/TrackingStep";
import EmergencyStep from "@/components/onboarding/steps/EmergencyStep";

type EditMode = null | "income" | "goal" | "tracks" | "emergency" | "plan";

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const FinancialProfileSection = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { profile, loading, update, refresh } = useFinancialProfile();
  const [edit, setEdit] = useState<EditMode>(null);
  const [draft, setDraft] = useState<{
    monthly_income?: number;
    financial_goal?: FinancialGoal;
    tracks_expenses?: TracksExpenses;
    has_emergency_fund?: boolean;
  }>({});
  const [applying, setApplying] = useState(false);

  if (loading || !profile) return null;

  const openEdit = (mode: EditMode) => {
    setDraft({
      monthly_income: profile.monthly_income ?? undefined,
      financial_goal: profile.financial_goal ?? undefined,
      tracks_expenses: profile.tracks_expenses ?? undefined,
      has_emergency_fund: profile.has_emergency_fund ?? undefined,
    });
    setEdit(mode);
  };

  const saveEdit = async () => {
    const err = await update(draft);
    if (err) {
      toast.error("Erro ao salvar");
      return;
    }
    toast.success("Atualizado!");
    setEdit(null);
  };

  const restartOnboarding = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ onboarding_completed: false })
      .eq("id", user.id);
    if (error) {
      toast.error("Erro ao reiniciar onboarding");
      return;
    }
    try {
      localStorage.removeItem("onboarding_draft_v1");
    } catch {
      /* ignore */
    }
    // Client-side nav; ProtectedRoutes re-fetches on pathname change
    navigate("/onboarding");
  };

  const recalcAndApply = async () => {
    if (!user || !profile.monthly_income || !profile.financial_goal || !profile.tracks_expenses) {
      toast.error("Complete suas respostas primeiro");
      return;
    }
    setApplying(true);
    try {
      const answers: FinancialAnswers = {
        monthly_income: profile.monthly_income,
        financial_goal: profile.financial_goal,
        tracks_expenses: profile.tracks_expenses,
        has_emergency_fund: !!profile.has_emergency_fund,
      };
      const plan = generateFinancialPlan(answers);
      const { data: existing } = await supabase
        .from("budgets")
        .select("id, category")
        .eq("user_id", user.id);
      const map = new Map((existing || []).map((b) => [b.category, b.id]));

      for (const c of plan.categories) {
        const id = map.get(c.label);
        if (id) {
          await supabase.from("budgets").update({ limit_amount: c.amount }).eq("id", id);
        } else if (c.amount > 0) {
          await supabase.from("budgets").insert({
            user_id: user.id,
            category: c.label,
            limit_amount: c.amount,
          });
        }
      }
      toast.success("Orçamentos atualizados!");
      setEdit(null);
      refresh();
    } catch {
      toast.error("Erro ao atualizar");
    } finally {
      setApplying(false);
    }
  };

  const items = [
    {
      icon: Wallet,
      label: "Renda mensal",
      value: profile.monthly_income ? fmt(profile.monthly_income) : "—",
      mode: "income" as EditMode,
    },
    {
      icon: Target,
      label: "Objetivo principal",
      value: profile.financial_goal ? GOAL_LABELS[profile.financial_goal] : "—",
      mode: "goal" as EditMode,
    },
    {
      icon: Eye,
      label: "Controla os gastos?",
      value: profile.tracks_expenses ? TRACKS_LABELS[profile.tracks_expenses] : "—",
      mode: "tracks" as EditMode,
    },
    {
      icon: ShieldCheck,
      label: "Reserva de emergência",
      value: profile.has_emergency_fund === null
        ? "—"
        : profile.has_emergency_fund
          ? "Sim"
          : "Ainda não",
      mode: "emergency" as EditMode,
    },
  ];

  const hasAllAnswers =
    profile.monthly_income && profile.financial_goal && profile.tracks_expenses;
  const planAnswers: FinancialAnswers | null = hasAllAnswers
    ? {
        monthly_income: profile.monthly_income!,
        financial_goal: profile.financial_goal!,
        tracks_expenses: profile.tracks_expenses!,
        has_emergency_fund: !!profile.has_emergency_fund,
      }
    : null;
  const plan = planAnswers ? generateFinancialPlan(planAnswers) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <div className="glass-card rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display font-bold">Meu perfil financeiro</h2>
            <p className="text-xs text-muted-foreground">Suas respostas do onboarding</p>
          </div>
          <Sparkles className="w-5 h-5 text-primary" />
        </div>

        <div className="space-y-2">
          {items.map((it) => (
            <button
              key={it.mode}
              onClick={() => openEdit(it.mode)}
              className="w-full flex items-center justify-between gap-3 px-3 py-3 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/40 transition-colors text-left"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <it.icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">{it.label}</p>
                  <p className="text-sm font-medium truncate">{it.value}</p>
                </div>
              </div>
              <Pencil className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button
            variant="outline"
            className="w-full"
            disabled={!hasAllAnswers}
            onClick={() => setEdit("plan")}
          >
            <RefreshCw className="w-4 h-4" />
            Recalcular meu plano
          </Button>
          <button
            onClick={restartOnboarding}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors py-1"
          >
            Refazer onboarding completo
          </button>
        </div>
      </div>

      <Dialog open={edit !== null} onOpenChange={(o) => !o && setEdit(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="sr-only">Editar resposta</DialogTitle>
          </DialogHeader>

          {edit === "income" && (
            <IncomeStep
              value={draft.monthly_income ?? null}
              onChange={(v) => setDraft((d) => ({ ...d, monthly_income: v }))}
              onNext={saveEdit}
            />
          )}
          {edit === "goal" && (
            <GoalStep
              value={draft.financial_goal ?? null}
              onChange={(v) => setDraft((d) => ({ ...d, financial_goal: v }))}
              onNext={saveEdit}
            />
          )}
          {edit === "tracks" && (
            <TrackingStep
              value={draft.tracks_expenses ?? null}
              onChange={(v) => setDraft((d) => ({ ...d, tracks_expenses: v }))}
              onNext={saveEdit}
            />
          )}
          {edit === "emergency" && (
            <EmergencyStep
              value={draft.has_emergency_fund ?? null}
              onChange={(v) => setDraft((d) => ({ ...d, has_emergency_fund: v }))}
              onNext={saveEdit}
            />
          )}
          {edit === "plan" && plan && (
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-display font-bold">Plano recalculado</h3>
                <p className="text-sm text-muted-foreground">
                  Renda atual: {fmt(plan.income)}
                </p>
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto">
                {plan.categories.map((c) => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-secondary/20"
                  >
                    <div>
                      <p className="text-sm font-medium">{c.label}</p>
                      <p className="text-xs text-muted-foreground">{c.percent}%</p>
                    </div>
                    <p className="font-display font-bold text-primary">{fmt(c.amount)}</p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Vamos atualizar os orçamentos existentes e criar os que faltam.
              </p>
              <Button
                onClick={recalcAndApply}
                disabled={applying}
                className="w-full h-11 gradient-primary border-0 text-white"
              >
                {applying ? (
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  "Aplicar agora"
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default FinancialProfileSection;
