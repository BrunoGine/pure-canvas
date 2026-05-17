import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Sparkles, ChevronLeft, Building2, Crown, Zap, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useSubscription } from "@/hooks/useSubscription";
import { formatBRL, yearlySavingsPct, type PlanKey } from "@/lib/plans";

interface PlanRow {
  key: PlanKey;
  name: string;
  tagline: string | null;
  price_monthly_cents: number;
  price_yearly_cents: number;
  features: string[];
  highlight: boolean;
  sort_order: number;
}

const PLAN_ICON: Record<PlanKey, typeof Sparkles> = {
  free: Zap,
  premium: Crown,
  enterprise: Building2,
};

const PricingPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { subscription, plan: currentPlan, isTrialing, refresh } = useSubscription();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [interval, setInterval] = useState<"month" | "year">("month");
  const [loading, setLoading] = useState(true);
  const [startingTrial, setStartingTrial] = useState(false);

  useEffect(() => {
    supabase
      .from("plans")
      .select("*")
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setPlans((data as unknown as PlanRow[]) ?? []);
        setLoading(false);
      });
  }, []);

  const canStartTrial = !subscription?.trial_started_at && currentPlan === "free";

  const handleStartTrial = async () => {
    setStartingTrial(true);
    try {
      const { error } = await supabase.functions.invoke("start-trial");
      if (error) throw error;
      await refresh();
      toast({ title: "Premium ativado!", description: "Aproveite 30 dias grátis 🎉" });
      navigate("/");
    } catch (e: any) {
      toast({
        title: "Não foi possível ativar o trial",
        description: e?.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setStartingTrial(false);
    }
  };

  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const handleSubscribe = async (planKey: PlanKey) => {
    const key = `${planKey}_${interval}`;
    setCheckoutLoading(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { plan: planKey, interval },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
        return;
      }
      throw new Error("URL de checkout não recebida");
    } catch (e: any) {
      toast({
        title: "Não foi possível abrir o checkout",
        description: e?.message ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
    } finally {
      setCheckoutLoading(null);
    }
  };

  const handleManage = async () => {
    setCheckoutLoading("portal");
    try {
      const { data, error } = await supabase.functions.invoke("customer-portal");
      if (error) throw error;
      if (data?.url) window.location.href = data.url;
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message ?? "Tente novamente.", variant: "destructive" });
    } finally {
      setCheckoutLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-16 ambient-glow">
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-[11px] font-semibold uppercase tracking-wide mb-3">
            <Sparkles size={12} /> Escolha seu plano
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold leading-tight">
            Domine seu dinheiro <br className="hidden sm:block" />
            com a <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">Harp.I.A.</span>
          </h1>
          <p className="text-muted-foreground text-sm mt-3 max-w-md mx-auto">
            Comece grátis, evolua para Premium ou gerencie sua empresa — sem fricção, sem fidelidade.
          </p>
        </motion.div>

        {/* Toggle */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex p-1 rounded-full bg-secondary/60 border border-border/60">
            {(["month", "year"] as const).map((opt) => (
              <button
                key={opt}
                onClick={() => setInterval(opt)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  interval === opt
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {opt === "month" ? "Mensal" : "Anual"}
                {opt === "year" && (
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded-full bg-primary/20 text-primary text-[9px] font-bold">
                    -20%
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((p, i) => {
            const Icon = PLAN_ICON[p.key];
            const isCurrent = currentPlan === p.key;
            const priceCents =
              interval === "month" ? p.price_monthly_cents : p.price_yearly_cents;
            const savings =
              interval === "year"
                ? yearlySavingsPct(p.price_monthly_cents, p.price_yearly_cents)
                : 0;
            const isFree = p.key === "free";
            const isPremium = p.key === "premium";
            const isEnterprise = p.key === "enterprise";

            return (
              <motion.div
                key={p.key}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`relative rounded-3xl p-5 border flex flex-col ${
                  p.highlight
                    ? "border-primary/50 bg-gradient-to-b from-primary/10 to-background shadow-glow md:scale-[1.03] md:-my-2"
                    : isEnterprise
                    ? "border-[hsl(var(--business-primary)/0.4)] bg-gradient-to-b from-[hsl(var(--business-primary)/0.08)] to-background"
                    : "border-border/60 bg-card/40"
                }`}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground text-[10px] font-bold uppercase tracking-wide shadow-glow">
                    💎 Mais Popular
                  </div>
                )}

                <div className="flex items-center gap-2 mb-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                      isPremium
                        ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
                        : isEnterprise
                        ? "bg-[hsl(var(--business-primary)/0.2)] text-[hsl(var(--business-primary))]"
                        : "bg-secondary text-foreground"
                    }`}
                  >
                    <Icon size={18} />
                  </div>
                  <h3 className="font-display text-lg font-bold">{p.name}</h3>
                  {isCurrent && (
                    <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-secondary border border-border/60">
                      Atual
                    </span>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mb-4 min-h-[32px]">{p.tagline}</p>

                <div className="mb-4">
                  {isFree ? (
                    <div className="text-2xl font-bold">Grátis</div>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-3xl font-bold">{formatBRL(priceCents)}</span>
                        <span className="text-xs text-muted-foreground">
                          /{interval === "month" ? "mês" : "ano"}
                        </span>
                      </div>
                      {savings > 0 && (
                        <p className="text-[11px] text-primary font-semibold mt-0.5">
                          economize {savings}% no anual
                        </p>
                      )}
                    </>
                  )}
                </div>

                <ul className="space-y-2 mb-5 flex-1">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-xs">
                      <Check
                        size={14}
                        className={`mt-0.5 shrink-0 ${
                          isEnterprise ? "text-[hsl(var(--business-primary))]" : "text-primary"
                        }`}
                      />
                      <span className="text-foreground/90">{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                {isFree ? (
                  <button
                    disabled={isCurrent}
                    onClick={() => navigate("/")}
                    className="w-full py-3 rounded-2xl border border-border/60 text-sm font-semibold hover:bg-secondary/60 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isCurrent ? "Plano atual" : "Continuar grátis"}
                  </button>
                ) : isPremium ? (
                  canStartTrial ? (
                    <button
                      disabled={startingTrial}
                      onClick={handleStartTrial}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold shadow-glow hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-60"
                    >
                      {startingTrial ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                      ) : (
                        "Começar 1 mês grátis"
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => (isCurrent && !isTrialing ? handleManage() : handleSubscribe(p.key))}
                      disabled={checkoutLoading === `${p.key}_${interval}` || checkoutLoading === "portal"}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-bold shadow-glow disabled:opacity-60"
                    >
                      {checkoutLoading === `${p.key}_${interval}` || (checkoutLoading === "portal" && isCurrent) ? (
                        <Loader2 size={18} className="animate-spin mx-auto" />
                      ) : isCurrent && !isTrialing ? (
                        "Gerenciar assinatura"
                      ) : (
                        "Assinar Premium"
                      )}
                    </button>
                  )
                ) : (
                  <button
                    onClick={() => (isCurrent ? handleManage() : handleSubscribe(p.key))}
                    disabled={checkoutLoading === `${p.key}_${interval}` || checkoutLoading === "portal"}
                    className="w-full py-3 rounded-2xl bg-[hsl(var(--business-primary))] text-primary-foreground font-semibold disabled:opacity-60"
                  >
                    {checkoutLoading === `${p.key}_${interval}` || (checkoutLoading === "portal" && isCurrent) ? (
                      <Loader2 size={18} className="animate-spin mx-auto" />
                    ) : isCurrent ? (
                      "Gerenciar assinatura"
                    ) : (
                      "Gerenciar minha empresa"
                    )}
                  </button>
                )}

                {isPremium && canStartTrial && (
                  <p className="text-[10px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                    <Lock size={9} /> sem cartão • cancele quando quiser
                  </p>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Trust */}
        <div className="text-center text-[11px] text-muted-foreground mt-8 space-y-1">
          <p>🔒 Pagamento seguro processado pelo Stripe</p>
          <p>Cancele a qualquer momento, sem multa.</p>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
