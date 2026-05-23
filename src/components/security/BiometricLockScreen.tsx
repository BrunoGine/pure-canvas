import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Fingerprint, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSecurity } from "@/contexts/SecurityContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const BiometricLockScreen = () => {
  const { unlock } = useSecurity();
  const { user } = useAuth();
  const [trying, setTrying] = useState(false);
  const [name, setName] = useState<string>("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [autoTried, setAutoTried] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setName(data?.display_name ?? user.email ?? "");
        setAvatar(data?.avatar_url ?? null);
      });
  }, [user]);

  const handleUnlock = async () => {
    if (trying) return;
    setTrying(true);
    const res = await unlock();
    setTrying(false);
    if (!res.ok && res.error) {
      toast({ title: "Tente novamente", description: res.error, variant: "destructive" });
    }
  };

  // Try once automatically on mount for a frictionless feel
  useEffect(() => {
    if (autoTried) return;
    setAutoTried(true);
    handleUnlock();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const usePassword = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm flex flex-col items-center text-center gap-8"
      >
        <div className="w-24 h-24 rounded-full overflow-hidden bg-secondary flex items-center justify-center border-2 border-primary/30 shadow-glow">
          {avatar ? (
            <img src={avatar} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl font-display font-bold">
              {(name || "?").charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Bem-vindo de volta
          </p>
          <h1 className="font-display text-2xl font-bold">
            {name?.split(" ")[0] || "Olá"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Desbloqueie rapidamente com sua biometria
          </p>
        </div>

        <motion.button
          onClick={handleUnlock}
          whileTap={{ scale: 0.95 }}
          disabled={trying}
          className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-glow text-white relative"
          aria-label="Desbloquear com biometria"
        >
          <motion.div
            animate={trying ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ repeat: trying ? Infinity : 0, duration: 1.2 }}
          >
            <Fingerprint size={44} />
          </motion.div>
          {trying && (
            <span className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
          )}
        </motion.button>

        <Button
          onClick={handleUnlock}
          disabled={trying}
          className="w-full h-11 gradient-primary border-0 text-white shadow-glow"
        >
          {trying ? "Verificando…" : "Entrar com biometria"}
        </Button>

        <button
          onClick={usePassword}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <KeyRound size={14} /> Usar senha
        </button>
      </motion.div>
    </div>
  );
};

export default BiometricLockScreen;
