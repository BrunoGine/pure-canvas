import { Input } from "@/components/ui/input";
import StepLayout from "../StepLayout";

interface Props {
  value: string;
  onChange: (v: string) => void;
  onNext: () => void;
}

const NameStep = ({ value, onChange, onNext }: Props) => (
  <StepLayout
    title="Como podemos te chamar?"
    subtitle="Vamos personalizar sua experiência."
    onNext={onNext}
    nextDisabled={!value.trim()}
  >
    <Input
      autoFocus
      value={value}
      maxLength={60}
      placeholder="Seu nome"
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={(e) => e.key === "Enter" && value.trim() && onNext()}
      className="h-14 text-lg bg-secondary/30 border-border/50"
    />
  </StepLayout>
);

export default NameStep;
