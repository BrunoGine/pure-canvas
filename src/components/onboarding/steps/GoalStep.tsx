import StepLayout from "../StepLayout";
import { GOAL_LABELS, type FinancialGoal } from "@/lib/financialPlan";
import { cn } from "@/lib/utils";
import { PiggyBank, TrendingDown, LineChart, Wallet, Sparkles } from "lucide-react";

const ICONS: Record<FinancialGoal, typeof PiggyBank> = {
  save: PiggyBank,
  debt: TrendingDown,
  invest: LineChart,
  control: Wallet,
  organize: Sparkles,
};

interface Props {
  value: FinancialGoal | null;
  onChange: (v: FinancialGoal) => void;
  onNext: () => void;
}

const GoalStep = ({ value, onChange, onNext }: Props) => {
  const options = Object.entries(GOAL_LABELS) as [FinancialGoal, string][];
  return (
    <StepLayout
      title="Qual seu principal objetivo?"
      subtitle="Vamos focar no que importa pra você agora."
      onNext={onNext}
      nextDisabled={!value}
    >
      <div className="space-y-2">
        {options.map(([key, label]) => {
          const Icon = ICONS[key];
          return (
            <button
              key={key}
              type="button"
              onClick={() => onChange(key)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left",
                value === key
                  ? "border-primary bg-primary/10 ring-2 ring-primary"
                  : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                <Icon className="w-5 h-5" />
              </div>
              <span className="font-medium">{label}</span>
            </button>
          );
        })}
      </div>
    </StepLayout>
  );
};

export default GoalStep;
