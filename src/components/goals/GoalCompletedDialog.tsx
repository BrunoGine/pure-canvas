import { useEffect } from "react";
import confetti from "canvas-confetti";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PartyPopper } from "lucide-react";
import type { Goal } from "@/hooks/useGoals";

interface Props {
  goal: Goal | null;
  onClose: () => void;
}

const fireConfetti = () => {
  const duration = 1500;
  const end = Date.now() + duration;
  (function frame() {
    confetti({ particleCount: 4, angle: 60, spread: 55, origin: { x: 0 } });
    confetti({ particleCount: 4, angle: 120, spread: 55, origin: { x: 1 } });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
};

const GoalCompletedDialog = ({ goal, onClose }: Props) => {
  useEffect(() => {
    if (goal) fireConfetti();
  }, [goal]);

  return (
    <Dialog open={!!goal} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="glass-card border-border/30 text-center">
        <DialogHeader className="items-center">
          <div className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-glow mb-2">
            <PartyPopper className="text-primary-foreground" size={28} />
          </div>
          <DialogTitle className="text-xl">🎉 Parabéns!</DialogTitle>
          <DialogDescription>
            Você concluiu sua meta: <span className="font-semibold text-foreground">{goal?.name}</span>
          </DialogDescription>
        </DialogHeader>
        <Button onClick={onClose} className="gradient-primary text-white border-0 mt-2">
          Comemorar
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default GoalCompletedDialog;
