import StepLayout from "../StepLayout";
import { cn } from "@/lib/utils";
import { ShieldCheck, ShieldOff } from "lucide-react";

interface Props {
  value: boolean | null;
  onChange: (v: boolean) => void;
  onNext: () => void;
}

const EmergencyStep = ({ value, onChange, onNext }: Props) => (
  <StepLayout
    title="Você já tem reserva de emergência?"
    subtitle="É um valor guardado pra imprevistos, geralmente 3 a 6 meses de gastos."
    onNext={onNext}
    nextDisabled={value === null}
  >
    <div className="grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => onChange(true)}
        className={cn(
          "flex flex-col items-center gap-2 px-4 py-6 rounded-xl border transition-all",
          value === true
            ? "border-primary bg-primary/10 ring-2 ring-primary"
            : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
        )}
      >
        <ShieldCheck className="w-7 h-7 text-primary" />
        <span className="font-medium">Sim</span>
      </button>
      <button
        type="button"
        onClick={() => onChange(false)}
        className={cn(
          "flex flex-col items-center gap-2 px-4 py-6 rounded-xl border transition-all",
          value === false
            ? "border-primary bg-primary/10 ring-2 ring-primary"
            : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
        )}
      >
        <ShieldOff className="w-7 h-7 text-muted-foreground" />
        <span className="font-medium">Ainda não</span>
      </button>
    </div>
  </StepLayout>
);

export default EmergencyStep;
