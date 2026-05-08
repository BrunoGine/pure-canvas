import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onNext?: () => void;
  nextDisabled?: boolean;
  nextLabel?: string;
  hideNext?: boolean;
}

const StepLayout = ({
  title,
  subtitle,
  children,
  onNext,
  nextDisabled,
  nextLabel = "Continuar",
  hideNext,
}: Props) => (
  <div className="space-y-6">
    <div className="space-y-2">
      <h1 className="text-3xl font-display font-bold leading-tight">{title}</h1>
      {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
    </div>
    <div>{children}</div>
    {!hideNext && (
      <Button
        onClick={onNext}
        disabled={nextDisabled}
        className="w-full h-12 gradient-primary border-0 text-white shadow-glow text-base"
      >
        {nextLabel}
        <ArrowRight className="w-4 h-4" />
      </Button>
    )}
  </div>
);

export default StepLayout;
