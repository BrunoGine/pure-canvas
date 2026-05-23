import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecurity } from "@/contexts/SecurityContext";
import { toast } from "@/hooks/use-toast";

const EnableBiometricSheet = () => {
  const { shouldOfferBiometric, enableBiometric, dismissBiometricOffer } = useSecurity();
  const [loading, setLoading] = useState(false);

  if (!shouldOfferBiometric) return null;

  const activate = async () => {
    setLoading(true);
    const res = await enableBiometric();
    setLoading(false);
    if (res.ok) {
      toast({ title: "Biometria ativada", description: "Este dispositivo será lembrado com segurança." });
    } else if (res.error) {
      toast({ title: "Não foi possível ativar", description: res.error, variant: "destructive" });
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-4"
      >
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: "spring", damping: 28, stiffness: 280 }}
          className="w-full max-w-sm glass-card rounded-3xl p-6 space-y-5 relative"
        >
          <button
            onClick={dismissBiometricOffer}
            className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>

          <div className="flex items-center justify-center">
            <div className="w-16 h-16 rounded-2xl gradient-primary flex items-center justify-center shadow-glow text-white">
              <Fingerprint size={32} />
            </div>
          </div>

          <div className="text-center space-y-1">
            <h2 className="font-display text-xl font-bold">Entrar com biometria</h2>
            <p className="text-sm text-muted-foreground">
              Desbloqueie rapidamente com sua digital ou rosto. Sua senha continua válida.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/30 rounded-xl px-3 py-2.5">
            <ShieldCheck size={14} className="text-primary shrink-0" />
            <span>Este dispositivo será lembrado com segurança.</span>
          </div>

          <div className="space-y-2">
            <Button
              onClick={activate}
              disabled={loading}
              className="w-full h-11 gradient-primary border-0 text-white shadow-glow"
            >
              {loading ? "Configurando…" : "Ativar biometria"}
            </Button>
            <button
              onClick={dismissBiometricOffer}
              className="w-full text-sm text-muted-foreground hover:text-foreground py-2"
            >
              Agora não
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EnableBiometricSheet;
