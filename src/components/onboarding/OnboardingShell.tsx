import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Props {
  step: number;
  total: number;
  onBack?: () => void;
  children: ReactNode;
}

const OnboardingShell = ({ step, total, onBack, children }: Props) => {
  const pct = Math.round(((step + 1) / total) * 100);
  return (
    <div className="min-h-screen bg-background flex flex-col px-4 py-6 ambient-glow overflow-hidden">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md mx-auto flex flex-col gap-4 relative z-10 flex-1">
        <div className="flex items-center gap-3">
          {onBack ? (
            <button
              onClick={onBack}
              className="p-2 -ml-2 rounded-xl hover:bg-secondary/50 transition-colors text-muted-foreground"
              aria-label="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          ) : (
            <div className="w-9" />
          )}
          <Progress value={pct} className="h-1.5 flex-1" />
        </div>

        <div className="flex-1 flex items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -24 }}
              transition={{ duration: 0.25 }}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default OnboardingShell;
