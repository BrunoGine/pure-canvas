import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

const DISMISS_KEY = "trial-banner-dismissed-until";

const TrialBanner = () => {
  const navigate = useNavigate();
  const { isTrialing, trialDaysLeft } = useSubscription();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const until = localStorage.getItem(DISMISS_KEY);
    if (until && Number(until) > Date.now()) setDismissed(true);
  }, []);

  if (!isTrialing || dismissed) return null;

  const dismiss = () => {
    // Hide for 24h
    localStorage.setItem(DISMISS_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
    setDismissed(true);
  };

  return (
    <div className="w-full max-w-lg px-4 pt-2">
      <div className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-primary/15 to-primary-glow/15 border border-primary/30 text-xs">
        <Sparkles size={14} className="text-primary shrink-0" />
        <span className="flex-1 min-w-0">
          <strong className="text-primary">Premium grátis</strong> •{" "}
          {trialDaysLeft} {trialDaysLeft === 1 ? "dia restante" : "dias restantes"}
        </span>
        <button
          onClick={() => navigate("/planos")}
          className="px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-semibold text-[11px]"
        >
          Assinar
        </button>
        <button onClick={dismiss} aria-label="Dispensar" className="p-1 text-muted-foreground hover:text-foreground">
          <X size={12} />
        </button>
      </div>
    </div>
  );
};

export default TrialBanner;
