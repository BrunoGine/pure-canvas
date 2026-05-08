import { useState } from "react";
import { Input } from "@/components/ui/input";
import StepLayout from "../StepLayout";
import { INCOME_PRESETS } from "@/lib/financialPlan";
import { cn } from "@/lib/utils";

interface Props {
  value: number | null;
  onChange: (v: number) => void;
  onNext: () => void;
}

const IncomeStep = ({ value, onChange, onNext }: Props) => {
  const [custom, setCustom] = useState(
    value && !INCOME_PRESETS.some((p) => p.value === value) ? String(value) : "",
  );

  return (
    <StepLayout
      title="Qual sua renda mensal aproximada?"
      subtitle="Não se preocupe — usamos só para personalizar suas metas."
      onNext={onNext}
      nextDisabled={!value || value <= 0}
    >
      <div className="space-y-2">
        {INCOME_PRESETS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => {
              onChange(p.value);
              setCustom("");
            }}
            className={cn(
              "w-full text-left px-4 py-3.5 rounded-xl border transition-all",
              value === p.value && !custom
                ? "border-primary bg-primary/10 ring-2 ring-primary"
                : "border-border/50 bg-secondary/30 hover:bg-secondary/60",
            )}
          >
            <span className="font-medium">{p.label}</span>
          </button>
        ))}
        <div className="pt-3">
          <p className="text-xs text-muted-foreground mb-2">Ou informe um valor exato:</p>
          <Input
            inputMode="numeric"
            placeholder="R$ 0,00"
            value={custom}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, "");
              setCustom(raw);
              const n = Number(raw);
              if (n > 0) onChange(n);
            }}
            className="h-12 bg-secondary/30 border-border/50"
          />
        </div>
      </div>
    </StepLayout>
  );
};

export default IncomeStep;
