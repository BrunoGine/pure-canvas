import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({ theme: "light", toggleTheme: () => {} });

function getSystemTheme(): Theme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("finapp-theme");
    return (saved as Theme) || getSystemTheme();
  });
  const [userId, setUserId] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  // Listen for auth changes to load saved preference from DB
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      if (uid) {
        // Load theme preference from profiles
        supabase
          .from("profiles")
          .select("theme_preference")
          .eq("id", uid)
          .single()
          .then(({ data }) => {
            const pref = (data as any)?.theme_preference as string | null;
            if (pref === "light" || pref === "dark") {
              setTheme(pref);
              localStorage.setItem("finapp-theme", pref);
            }
            setLoaded(true);
          });
      } else {
        setLoaded(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  // Listen for system theme changes (only if no saved preference)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => {
      const saved = localStorage.getItem("finapp-theme");
      if (!saved) {
        setTheme(e.matches ? "dark" : "light");
      }
    };
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => {
      const next = prev === "light" ? "dark" : "light";
      localStorage.setItem("finapp-theme", next);
      // Save to DB if logged in
      if (userId) {
        (supabase as any)
          .from("profiles")
          .update({ theme_preference: next })
          .eq("id", userId)
          .then(() => {});
      }
      return next;
    });
  }, [userId]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
