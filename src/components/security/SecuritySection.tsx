import { motion } from "framer-motion";
import { Fingerprint, KeyRound, LogOut, ShieldCheck } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useSecurity } from "@/contexts/SecurityContext";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

const SecuritySection = () => {
  const {
    supported,
    rememberMe,
    setRememberMe,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
    forgetDevice,
  } = useSecurity();
  const [busy, setBusy] = useState(false);

  const handleBiometricToggle = async (next: boolean) => {
    if (busy) return;
    setBusy(true);
    if (next) {
      const res = await enableBiometric();
      if (res.ok) toast({ title: "Biometria ativada" });
      else if (res.error) toast({ title: "Não foi possível ativar", description: res.error, variant: "destructive" });
    } else {
      await disableBiometric();
      toast({ title: "Biometria desativada" });
    }
    setBusy(false);
  };

  const handleForget = async () => {
    if (busy) return;
    setBusy(true);
    await forgetDevice();
    setBusy(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18 }}
    >
      <div className="glass-card rounded-xl overflow-hidden">
        <div className="px-4 pt-4 pb-2 flex items-center gap-2">
          <ShieldCheck size={16} className="text-primary" />
          <p className="text-sm font-semibold">Segurança e acesso</p>
        </div>
        <div className="divide-y divide-border/50">
          <div className="flex items-center justify-between px-4 py-3.5">
            <div className="flex items-center gap-3">
              <KeyRound size={18} className="text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Manter conectado</p>
                <p className="text-xs text-muted-foreground">
                  Mantém você logado neste dispositivo.
                </p>
              </div>
            </div>
            <Switch checked={rememberMe} onCheckedChange={setRememberMe} />
          </div>

          {supported && (
            <div className="flex items-center justify-between px-4 py-3.5">
              <div className="flex items-center gap-3">
                <Fingerprint size={18} className="text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Usar biometria</p>
                  <p className="text-xs text-muted-foreground">
                    Digital ou rosto para desbloquear o app.
                  </p>
                </div>
              </div>
              <Switch
                checked={biometricEnabled}
                onCheckedChange={handleBiometricToggle}
                disabled={busy}
              />
            </div>
          )}

          <button
            onClick={handleForget}
            disabled={busy}
            className="flex items-center gap-3 w-full px-4 py-3.5 text-left hover:bg-destructive/5 transition-colors"
          >
            <LogOut size={18} className="text-destructive" />
            <div>
              <p className="text-sm font-medium text-destructive">Esquecer este dispositivo</p>
              <p className="text-xs text-muted-foreground">
                Remove biometria e desloga desta sessão.
              </p>
            </div>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default SecuritySection;
