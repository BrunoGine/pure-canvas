import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ArrowRight, Briefcase, Store, Wrench, ShoppingBag, Sparkles, Users, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import OnboardingShell from "@/components/onboarding/OnboardingShell";
import StepLayout from "@/components/onboarding/StepLayout";
import { cn } from "@/lib/utils";

const TOTAL = 6;

const TYPE_OPTIONS = [
  { value: "mei", label: "MEI", icon: Briefcase },
  { value: "small", label: "Pequeno negócio", icon: Building2 },
  { value: "freelance", label: "Autônomo", icon: Sparkles },
  { value: "service", label: "Prestação de serviços", icon: Wrench },
  { value: "store", label: "Loja", icon: Store },
  { value: "other", label: "Outro", icon: ShoppingBag },
];

const SEGMENTS = [
  "Alimentação", "Roupas", "Tecnologia", "Beleza", "Saúde",
  "Educação", "Construção", "Serviços", "Outro",
];

const REVENUE_PRESETS = [
  { label: "Até R$ 5 mil", value: 5000 },
  { label: "R$ 5 mil – R$ 15 mil", value: 15000 },
  { label: "R$ 15 mil – R$ 50 mil", value: 50000 },
  { label: "Mais de R$ 50 mil", value: 100000 },
];

const GOALS = [
  { value: "grow_sales", label: "Crescer vendas", icon: TrendingUp },
  { value: "organize", label: "Organizar finanças", icon: Briefcase },
  { value: "control_inventory", label: "Controlar estoque", icon: Store },
  { value: "reduce_costs", label: "Reduzir gastos", icon: Wrench },
  { value: "professionalize", label: "Profissionalizar empresa", icon: Sparkles },
];

interface Draft {
  name: string;
  business_type: string | null;
  segment: string | null;
  monthly_revenue: number | null;
  employees_count: number | null;
  main_goal: string | null;
}
const empty: Draft = {
  name: "", business_type: null, segment: null,
  monthly_revenue: null, employees_count: null, main_goal: null,
};

const KEY = "business_onboarding_draft_v1";

const BusinessOnboardingPage = () => {
  const { user } = useAuth();
  const { enterBusinessMode, refreshCompanies } = useCompany();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>(empty);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setDraft({ ...empty, ...JSON.parse(raw) });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(draft));
  }, [draft]);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const next = () => setStep((s) => Math.min(s + 1, TOTAL - 1));
  const back = () => setStep((s) => Math.max(s - 1, 0));

  const finish = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data, error } = await supabase
        .from("companies")
        .insert({
          user_id: user.id,
          name: draft.name.trim(),
          business_type: draft.business_type,
          segment: draft.segment,
          monthly_revenue: draft.monthly_revenue,
          employees_count: draft.employees_count,
          main_goal: draft.main_goal,
        })
        .select("id")
        .single();
      if (error) throw error;
      await refreshCompanies();
      await enterBusinessMode(data.id);
      localStorage.removeItem(KEY);
      toast.success("Modo Empresa ativado! 🏢");
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message ?? "Erro ao criar empresa");
    } finally {
      setSaving(false);
    }
  };

  return (
    <OnboardingShell step={step} total={TOTAL} onBack={step > 0 ? back : undefined}>
      {step === 0 && (
        <StepLayout
          title="Qual o nome da sua empresa?"
          subtitle="Vamos preparar seu ambiente empresarial."
          onNext={next}
          nextDisabled={!draft.name.trim()}
        >
          <Input
            autoFocus
            value={draft.name}
            maxLength={80}
            placeholder="Ex: Padaria do Zé"
            onChange={(e) => set("name", e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && draft.name.trim() && next()}
            className="h-14 text-lg bg-secondary/30 border-border/50"
          />
        </StepLayout>
      )}

      {step === 1 && (
        <StepLayout
          title="Que tipo de empresa é essa?"
          onNext={next}
          nextDisabled={!draft.business_type}
        >
          <div className="grid grid-cols-2 gap-2">
            {TYPE_OPTIONS.map((o) => {
              const Icon = o.icon;
              const active = draft.business_type === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => set("business_type", o.value)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 rounded-xl border transition-all text-left",
                    active
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
                  )}
                >
                  <Icon size={20} className="text-primary" />
                  <span className="font-medium text-sm">{o.label}</span>
                </button>
              );
            })}
          </div>
        </StepLayout>
      )}

      {step === 2 && (
        <StepLayout
          title="Em qual segmento você atua?"
          onNext={next}
          nextDisabled={!draft.segment}
        >
          <div className="grid grid-cols-2 gap-2">
            {SEGMENTS.map((s) => {
              const active = draft.segment === s;
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => set("segment", s)}
                  className={cn(
                    "px-4 py-3 rounded-xl border transition-all text-sm font-medium",
                    active
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
                  )}
                >
                  {s}
                </button>
              );
            })}
          </div>
        </StepLayout>
      )}

      {step === 3 && (
        <StepLayout
          title="Faturamento médio mensal?"
          subtitle="Estimativa serve só para personalizar seus relatórios."
          onNext={next}
          nextDisabled={!draft.monthly_revenue || draft.monthly_revenue <= 0}
        >
          <div className="space-y-2">
            {REVENUE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => set("monthly_revenue", p.value)}
                className={cn(
                  "w-full text-left px-4 py-3.5 rounded-xl border transition-all",
                  draft.monthly_revenue === p.value
                    ? "border-primary bg-primary/10 ring-2 ring-primary"
                    : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
                )}
              >
                <span className="font-medium">{p.label}</span>
              </button>
            ))}
            <Input
              inputMode="numeric"
              placeholder="Ou informe um valor exato"
              value={draft.monthly_revenue && !REVENUE_PRESETS.find(p => p.value === draft.monthly_revenue) ? String(draft.monthly_revenue) : ""}
              onChange={(e) => {
                const n = Number(e.target.value.replace(/\D/g, ""));
                if (n > 0) set("monthly_revenue", n);
              }}
              className="h-12 bg-secondary/30 border-border/50 mt-2"
            />
          </div>
        </StepLayout>
      )}

      {step === 4 && (
        <StepLayout
          title="Quantos funcionários?"
          subtitle="Pode pular se trabalha sozinho(a)."
          onNext={next}
        >
          <div className="space-y-3">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={draft.employees_count ?? ""}
              onChange={(e) => set("employees_count", e.target.value ? Number(e.target.value) : null)}
              className="h-14 text-lg bg-secondary/30 border-border/50"
            />
            <Button variant="ghost" className="w-full text-muted-foreground" onClick={next}>
              Pular esta pergunta
            </Button>
          </div>
        </StepLayout>
      )}

      {step === 5 && (
        <StepLayout
          title="Qual seu principal objetivo?"
          nextLabel={saving ? "Criando..." : "Concluir"}
          onNext={finish}
          nextDisabled={!draft.main_goal || saving}
        >
          <div className="space-y-2">
            {GOALS.map((g) => {
              const Icon = g.icon;
              const active = draft.main_goal === g.value;
              return (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => set("main_goal", g.value)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                    active
                      ? "border-primary bg-primary/10 ring-2 ring-primary"
                      : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
                  )}
                >
                  <Icon size={20} className="text-primary" />
                  <span className="font-medium">{g.label}</span>
                </button>
              );
            })}
          </div>
        </StepLayout>
      )}
    </OnboardingShell>
  );
};

export default BusinessOnboardingPage;
