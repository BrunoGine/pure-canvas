import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const KEY = "harpy:push_prompt_dismissed_at";
const SHOW_AFTER_DAYS = 7;
const VALUE_ACTION_KEY = "harpy:value_actions";

export function markValueAction() {
  try {
    const n = Number(localStorage.getItem(VALUE_ACTION_KEY) || "0") + 1;
    localStorage.setItem(VALUE_ACTION_KEY, String(n));
  } catch {}
}

function shouldShow() {
  try {
    const dismissed = Number(localStorage.getItem(KEY) || "0");
    if (dismissed && Date.now() - dismissed < SHOW_AFTER_DAYS * 86400_000) return false;
    const actions = Number(localStorage.getItem(VALUE_ACTION_KEY) || "0");
    return actions >= 1;
  } catch {
    return false;
  }
}

const PushPermissionPrompt = () => {
  const { user } = useAuth();
  const { supported, permission, isSubscribed, subscribe, busy } = usePushSubscription();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user || !supported) return;
    if (isSubscribed || permission === "denied" || permission === "granted") return;
    const t = setTimeout(() => { if (shouldShow()) setOpen(true); }, 1500);
    return () => clearTimeout(t);
  }, [user, supported, permission, isSubscribed]);

  const dismiss = () => {
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
    setOpen(false);
  };

  const accept = async () => {
    const ok = await subscribe();
    if (ok) setOpen(false);
    else dismiss();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center p-4"
          onClick={dismiss}
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            className="bg-card rounded-3xl p-6 max-w-md w-full border border-border/50 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={dismiss} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
              <X size={18} />
            </button>
            <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center text-white mb-4 shadow-glow">
              <Bell size={26} />
            </div>
            <h3 className="font-display text-xl font-bold mb-2">Receba lembretes inteligentes</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
              Avise-se sobre orçamentos próximos do limite, progresso de metas, novas contribuições em vaquinhas e sua ofensiva de estudos — sem spam.
            </p>
            <div className="flex gap-2">
              <button onClick={dismiss} className="flex-1 py-3 rounded-xl text-sm font-medium text-muted-foreground hover:bg-secondary transition">
                Agora não
              </button>
              <button
                onClick={accept}
                disabled={busy}
                className="flex-1 py-3 rounded-xl text-sm font-semibold text-white gradient-primary shadow-glow disabled:opacity-50"
              >
                {busy ? "Ativando..." : "Ativar"}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PushPermissionPrompt;
