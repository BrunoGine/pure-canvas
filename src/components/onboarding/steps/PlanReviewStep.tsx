import StepLayout from "../StepLayout";
import { Button } from "@/components/ui/button";
import { generateFinancialPlan, type FinancialAnswers } from "@/lib/financialPlan";
import { motion } from "framer-motion";

interface Props {
  answers: FinancialAnswers;
  onApply: () => void;
  onSkip: () => void;
  loading: boolean;
}

const fmt = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

const PlanReviewStep = ({ answers, onApply, onSkip, loading }: Props) => {
  const plan = generateFinancialPlan(answers);

  return (
    <StepLayout
      title="Sua sugestão de plano"
      subtitle={`Com base na sua renda de ${fmt(plan.income)}, sugerimos esta divisão:`}
      hideNext
    >
      <div className="space-y-2 mb-5">
        {plan.categories.map((c, i) => (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card rounded-xl p-3 flex items-center justify-between"
          >
            <div>
              <p className="font-medium text-sm">{c.label}</p>
              <p className="text-xs text-muted-foreground">{c.percent}% da renda</p>
            </div>
            <p className="font-display font-bold text-primary">{fmt(c.amount)}</p>
          </motion.div>
        ))}
      </div>

      <div className="space-y-2">
        <Button
          onClick={onApply}
          disabled={loading}
          className="w-full h-12 gradient-primary border-0 text-white shadow-glow text-base"
        >
          {loading ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Aplicar automaticamente"
          )}
        </Button>
        <Button
          onClick={onSkip}
          disabled={loading}
          variant="ghost"
          className="w-full h-11 text-muted-foreground"
        >
          Pular por agora
        </Button>
      </div>
    </StepLayout>
  );
};

export default PlanReviewStep;
