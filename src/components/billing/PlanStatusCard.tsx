import { useNavigate } from "react-router-dom";
import { Crown, Sparkles, ChevronRight, Zap } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { PLAN_LABELS } from "@/lib/plans";

const PlanStatusCard = () => {
  const navigate = useNavigate();
  const { effectivePlan, isTrialing, trialDaysLeft, loading } = useSubscription();

  if (loading) return null;

  const isPaid = effectivePlan !== "free";
  const Icon = isPaid ? Crown : Zap;

  return (
    <button
      onClick={() => navigate("/planos")}
      className={`w-full glass-card rounded-2xl p-4 flex items-center gap-3 text-left transition-all hover:scale-[1.01] ${
        isPaid ? "border-primary/40 shadow-glow" : ""
      }`}
      style={
        isPaid
          ? { background: "linear-gradient(135deg, hsl(var(--primary)/0.12), hsl(var(--background)) 60%)" }
          : undefined
      }
    >
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
          isPaid
            ? "bg-gradient-to-br from-primary to-primary-glow text-primary-foreground"
            : "bg-secondary text-foreground"
        }`}
      >
        <Icon size={20} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold">Plano {PLAN_LABELS[effectivePlan]}</p>
          {isTrialing && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/20 text-primary">
              Trial
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isTrialing
            ? `${trialDaysLeft} ${trialDaysLeft === 1 ? "dia restante" : "dias restantes"} • assinar para continuar`
            : isPaid
            ? "Tudo desbloqueado — gerencie sua assinatura"
            : "Faça upgrade e desbloqueie cursos + IA avançada"}
        </p>
      </div>
      {!isPaid && (
        <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-primary">
          <Sparkles size={12} /> Upgrade
        </span>
      )}
      <ChevronRight size={16} className="text-muted-foreground shrink-0" />
    </button>
  );
};

export default PlanStatusCard;
