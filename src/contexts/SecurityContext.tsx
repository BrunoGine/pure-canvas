import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
  isBiometricSupported,
  registerCredential,
  verifyCredential,
  detectDeviceLabel,
} from "@/lib/webauthn";
import {
  getRememberMe,
  setRememberMe as persistRememberMe,
} from "@/lib/secureStorage";
import {
  touchCredentialUsage,
  useDeleteDeviceCredential,
  useSaveDeviceCredential,
} from "@/hooks/useDeviceCredentials";
import { supabase } from "@/integrations/supabase/client";

const LS_BIO_ENABLED = "security.biometricEnabled";
const LS_CRED_ID = "security.credentialId";
const LS_LAST_ACTIVE = "security.lastActiveAt";
const LS_PROMPT_DISMISSED = "security.bioPromptDismissed";

const INACTIVITY_LOCK_MS = 5 * 60 * 1000; // 5 min
const HARD_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const ACTIVITY_DEBOUNCE_MS = 30_000;

interface SecurityContextValue {
  // Capabilities
  supported: boolean;
  // Preferences
  rememberMe: boolean;
  setRememberMe: (v: boolean) => void;
  biometricEnabled: boolean;
  // Lock state
  locked: boolean;
  // Actions
  enableBiometric: () => Promise<{ ok: boolean; error?: string }>;
  disableBiometric: () => Promise<void>;
  unlock: () => Promise<{ ok: boolean; error?: string }>;
  forgetDevice: () => Promise<void>;
  // Bottom-sheet helpers
  shouldOfferBiometric: boolean;
  dismissBiometricOffer: () => void;
}

const SecurityContext = createContext<SecurityContextValue | null>(null);

export const useSecurity = () => {
  const ctx = useContext(SecurityContext);
  if (!ctx) throw new Error("useSecurity must be used inside SecurityProvider");
  return ctx;
};

const readBool = (key: string, def = false) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? def : v === "true";
  } catch {
    return def;
  }
};

export const SecurityProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading: authLoading } = useAuth();
  const [supported, setSupported] = useState(false);
  const [rememberMe, setRememberMeState] = useState<boolean>(getRememberMe());
  const [biometricEnabled, setBiometricEnabled] = useState<boolean>(() =>
    readBool(LS_BIO_ENABLED)
  );
  const [locked, setLocked] = useState(false);
  const [promptDismissed, setPromptDismissed] = useState(
    () => readBool(LS_PROMPT_DISMISSED) || biometricEnabled
  );
  const initRef = useRef(false);

  const saveCred = useSaveDeviceCredential();
  const deleteCred = useDeleteDeviceCredential();

  // Capability detection
  useEffect(() => {
    let mounted = true;
    isBiometricSupported().then((v) => mounted && setSupported(v));
    return () => {
      mounted = false;
    };
  }, []);

  // Initial lock evaluation (runs once per user session)
  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setLocked(false);
      initRef.current = false;
      return;
    }
    if (initRef.current) return;
    initRef.current = true;

    // Hard expiry: if last activity is too old, sign out
    try {
      const last = localStorage.getItem(LS_LAST_ACTIVE);
      if (last) {
        const ageMs = Date.now() - new Date(last).getTime();
        if (ageMs > HARD_EXPIRY_MS) {
          supabase.auth.signOut();
          return;
        }
      }
    } catch {
      /* ignore */
    }

    if (biometricEnabled && supported) {
      const credId = localStorage.getItem(LS_CRED_ID);
      if (credId) {
        setLocked(true);
        return;
      }
    }
    try {
      localStorage.setItem(LS_LAST_ACTIVE, new Date().toISOString());
    } catch {
      /* ignore */
    }
  }, [user, authLoading, biometricEnabled, supported]);

  // Visibility-based re-lock
  useEffect(() => {
    if (!user || !biometricEnabled || !supported) return;
    const credId = localStorage.getItem(LS_CRED_ID);
    if (!credId) return;

    const onVisible = () => {
      if (document.visibilityState !== "visible") return;
      if (locked) return;
      try {
        const last = localStorage.getItem(LS_LAST_ACTIVE);
        if (!last) return;
        const ageMs = Date.now() - new Date(last).getTime();
        if (ageMs > INACTIVITY_LOCK_MS) setLocked(true);
      } catch {
        /* ignore */
      }
    };

    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [user, biometricEnabled, supported, locked]);

  // Debounced activity tracker
  useEffect(() => {
    if (!user || locked) return;
    let last = 0;
    const touch = () => {
      const now = Date.now();
      if (now - last < ACTIVITY_DEBOUNCE_MS) return;
      last = now;
      try {
        localStorage.setItem(LS_LAST_ACTIVE, new Date().toISOString());
      } catch {
        /* ignore */
      }
    };
    const evs: (keyof WindowEventMap)[] = ["click", "keydown", "scroll", "pointermove"];
    evs.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    touch();
    return () => evs.forEach((e) => window.removeEventListener(e, touch));
  }, [user, locked]);

  const setRememberMe = useCallback((v: boolean) => {
    persistRememberMe(v);
    setRememberMeState(v);
  }, []);

  const enableBiometric = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    if (!user) return { ok: false, error: "Faça login primeiro" };
    if (!supported) return { ok: false, error: "Dispositivo sem biometria" };
    try {
      const cred = await registerCredential({
        userId: user.id,
        userName: user.email ?? user.id,
        displayName: user.user_metadata?.display_name ?? user.email ?? "Usuário",
      });
      await saveCred.mutateAsync({
        credentialId: cred.credentialId,
        publicKey: cred.publicKey,
        deviceLabel: detectDeviceLabel(),
      });
      localStorage.setItem(LS_CRED_ID, cred.credentialId);
      localStorage.setItem(LS_BIO_ENABLED, "true");
      localStorage.setItem(LS_PROMPT_DISMISSED, "true");
      localStorage.setItem(LS_LAST_ACTIVE, new Date().toISOString());
      setBiometricEnabled(true);
      setPromptDismissed(true);
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message ?? "Não foi possível ativar biometria" };
    }
  }, [user, supported, saveCred]);

  const disableBiometric = useCallback(async () => {
    const credId = localStorage.getItem(LS_CRED_ID);
    if (credId) {
      try {
        await deleteCred.mutateAsync(credId);
      } catch {
        /* still proceed to clear locally */
      }
    }
    localStorage.removeItem(LS_CRED_ID);
    localStorage.setItem(LS_BIO_ENABLED, "false");
    setBiometricEnabled(false);
  }, [deleteCred]);

  const unlock = useCallback(async (): Promise<{ ok: boolean; error?: string }> => {
    const credId = localStorage.getItem(LS_CRED_ID);
    if (!credId) {
      setLocked(false);
      return { ok: true };
    }
    const ok = await verifyCredential(credId);
    if (!ok) return { ok: false, error: "Não foi possível verificar a biometria" };
    setLocked(false);
    try {
      localStorage.setItem(LS_LAST_ACTIVE, new Date().toISOString());
    } catch {
      /* ignore */
    }
    touchCredentialUsage(credId).catch(() => {});
    return { ok: true };
  }, []);

  const forgetDevice = useCallback(async () => {
    await disableBiometric();
    localStorage.removeItem(LS_LAST_ACTIVE);
    localStorage.removeItem(LS_PROMPT_DISMISSED);
    setPromptDismissed(false);
    await supabase.auth.signOut();
  }, [disableBiometric]);

  const dismissBiometricOffer = useCallback(() => {
    localStorage.setItem(LS_PROMPT_DISMISSED, "true");
    setPromptDismissed(true);
  }, []);

  const shouldOfferBiometric = useMemo(
    () => !!user && supported && !biometricEnabled && !promptDismissed,
    [user, supported, biometricEnabled, promptDismissed]
  );

  const value: SecurityContextValue = {
    supported,
    rememberMe,
    setRememberMe,
    biometricEnabled,
    locked,
    enableBiometric,
    disableBiometric,
    unlock,
    forgetDevice,
    shouldOfferBiometric,
    dismissBiometricOffer,
  };

  return <SecurityContext.Provider value={value}>{children}</SecurityContext.Provider>;
};
