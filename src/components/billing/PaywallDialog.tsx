import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Lock, GraduationCap, Building2, Bot, BarChart3 } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";

export type PaywallTrigger =
  | "generic"
  | "courses"
  | "enterprise"
  | "harpia"
  | "reports";

interface PaywallDialogProps {
  open: boolean;
  trigger: PaywallTrigger;
  onClose: () => void;
}

const COPY: Record<PaywallTrigger, { icon: typeof Sparkles; title: string; subtitle: string }> = {
  generic: {
    icon: Sparkles,
    title: "Desbloqueie o Harp.I.A. Premium",
    subtitle: "Educação financeira, IA avançada e relatórios — tudo num plano só.",
  },
  courses: {
    icon: GraduationCap,
    title: "Assista esta aula com Premium",
    subtitle: "Cursos completos, quizzes e certificados oficiais para acelerar sua jornada.",
  },
  enterprise: {
    icon: Building2,
    title: "Gerencie sua empresa com o plano Empresa",
    subtitle: "Dashboard, balanço, fluxo de caixa e IA empresarial num só lugar.",
  },
  harpia: {
    icon: Bot,
    title: "Harp.I.A. avançada sem limites",
    subtitle: "Análises profundas, insights e respostas ilimitadas no Premium.",
  },
  reports: {
    icon: BarChart3,
    title: "Relatórios avançados liberados no Premium",
    subtitle: "Entenda para onde seu dinheiro está indo com análises mensais e tendências.",
  },
};

const PaywallDialog = ({ open, trigger, onClose }: PaywallDialogProps) => {
  const navigate = useNavigate();
  const { subscription } = useSubscription();
  const canStartTrial = !subscription?.trial_started_at;
  const c = COPY[trigger];
  const Icon = c.icon;

  const goToPricing = () => {
    onClose();
    navigate("/planos");
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 280, damping: 28 }}
            className="relative w-full max-w-md glass-card rounded-t-3xl sm:rounded-3xl p-6 overflow-hidden shadow-elevated"
          >
            <div
              className="absolute -top-24 -right-24 w-64 h-64 rounded-full opacity-40 blur-3xl pointer-events-none"
              style={{ background: "radial-gradient(circle, hsl(var(--primary)/0.6), transparent 70%)" }}
            />
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-secondary/80 transition-colors z-10"
              aria-label="Fechar"
            >
              <X size={18} />
            </button>

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-glow mb-4">
                <Icon size={26} className="text-primary-foreground" />
              </div>

              <h2 className="font-display text-2xl font-bold mb-2">{c.title}</h2>
              <p className="text-sm text-muted-foreground mb-5">{c.subtitle}</p>

              <ul className="space-y-2 mb-6">
                {[
                  "Cursos completos + certificados",
                  "Harp.I.A. avançada ilimitada",
                  "Relatórios e insights aprofundados",
                  "Badge premium no seu perfil",
                ].map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Sparkles size={14} className="text-primary mt-1 shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={goToPricing}
                className="w-full bg-gradient-to-r from-primary to-primary-glow text-primary-foreground font-semibold py-3.5 rounded-2xl shadow-glow hover:opacity-95 active:scale-[0.99] transition-all"
              >
                {canStartTrial ? "Começar 1 mês grátis" : "Ver planos"}
              </button>
              {canStartTrial && (
                <p className="text-[11px] text-center text-muted-foreground mt-2 flex items-center justify-center gap-1">
                  <Lock size={10} /> sem cartão • cancele quando quiser
                </p>
              )}

              <button
                onClick={onClose}
                className="w-full text-xs text-muted-foreground mt-3 py-2 hover:text-foreground transition-colors"
              >
                Agora não
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PaywallDialog;
