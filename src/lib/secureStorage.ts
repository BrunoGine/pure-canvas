/**
 * Storage wrapper for the Supabase auth session.
 *
 * "Remember me" controls whether the session survives closing the tab/window:
 *   - true  → persisted in localStorage (default)
 *   - false → kept in sessionStorage (evaporates on close)
 *
 * The choice is read from a localStorage flag (`security.rememberMe`) and a
 * `security.lastActiveAt` timestamp is used elsewhere for the inactivity gate.
 *
 * Reads always check BOTH stores so a session set under one mode still loads
 * after the user toggles the preference — no auth loops.
 */

const REMEMBER_KEY = "security.rememberMe";

const isBrowser = typeof window !== "undefined";

export const getRememberMe = (): boolean => {
  if (!isBrowser) return true;
  const raw = window.localStorage.getItem(REMEMBER_KEY);
  // Default: true (mantém conectado)
  return raw === null ? true : raw === "true";
};

export const setRememberMe = (value: boolean) => {
  if (!isBrowser) return;
  window.localStorage.setItem(REMEMBER_KEY, String(value));
};

const memoryStore: Record<string, string> = {};

const safeLocal = (): Storage | null => {
  try {
    return isBrowser ? window.localStorage : null;
  } catch {
    return null;
  }
};
const safeSession = (): Storage | null => {
  try {
    return isBrowser ? window.sessionStorage : null;
  } catch {
    return null;
  }
};

export const secureSupabaseStorage = {
  getItem(key: string): string | null {
    const remember = getRememberMe();
    const primary = remember ? safeLocal() : safeSession();
    const fallback = remember ? safeSession() : safeLocal();
    return (
      primary?.getItem(key) ??
      fallback?.getItem(key) ??
      memoryStore[key] ??
      null
    );
  },
  setItem(key: string, value: string): void {
    const remember = getRememberMe();
    const target = remember ? safeLocal() : safeSession();
    const other = remember ? safeSession() : safeLocal();
    try {
      target?.setItem(key, value);
      // Avoid duplication in the other store
      other?.removeItem(key);
    } catch {
      memoryStore[key] = value;
    }
  },
  removeItem(key: string): void {
    safeLocal()?.removeItem(key);
    safeSession()?.removeItem(key);
    delete memoryStore[key];
  },
};
