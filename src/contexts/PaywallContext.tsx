import { createContext, useCallback, useContext, useState, type ReactNode } from "react";
import PaywallDialog, { type PaywallTrigger } from "@/components/billing/PaywallDialog";

interface PaywallContextValue {
  open: (trigger?: PaywallTrigger) => void;
  close: () => void;
}

const PaywallContext = createContext<PaywallContextValue | null>(null);

export function PaywallProvider({ children }: { children: ReactNode }) {
  const [trigger, setTrigger] = useState<PaywallTrigger | null>(null);

  const open = useCallback((t: PaywallTrigger = "generic") => setTrigger(t), []);
  const close = useCallback(() => setTrigger(null), []);

  return (
    <PaywallContext.Provider value={{ open, close }}>
      {children}
      <PaywallDialog open={trigger !== null} trigger={trigger ?? "generic"} onClose={close} />
    </PaywallContext.Provider>
  );
}

export function usePaywall() {
  const ctx = useContext(PaywallContext);
  if (!ctx) throw new Error("usePaywall must be used within PaywallProvider");
  return ctx;
}
