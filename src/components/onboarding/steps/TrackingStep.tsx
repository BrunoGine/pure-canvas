import StepLayout from "../StepLayout";
import { TRACKS_LABELS, type TracksExpenses } from "@/lib/financialPlan";
import { cn } from "@/lib/utils";

interface Props {
  value: TracksExpenses | null;
  onChange: (v: TracksExpenses) => void;
  onNext: () => void;
}

const TrackingStep = ({ value, onChange, onNext }: Props) => {
  const options = Object.entries(TRACKS_LABELS) as [TracksExpenses, string][];
  return (
    <StepLayout
      title="Você costuma controlar seus gastos?"
      subtitle="Sem julgamento — é só pra entender seu ponto de partida."
      onNext={onNext}
      nextDisabled={!value}
    >
      <div className="space-y-2">
        {options.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            className={cn(
              "w-full px-4 py-4 rounded-xl border transition-all text-left font-medium",
              value === key
                ? "border-primary bg-primary/10 ring-2 ring-primary"
                : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
            )}
          >
            {label}
          </button>
        ))}
      </div>
    </StepLayout>
  );
};

export default TrackingStep;
