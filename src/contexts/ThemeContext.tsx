import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const { user } = useAuth();
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem("finapp-theme");
    return (saved as Theme) || getSystemTheme();
  });

  // Load saved preference from DB only when the authenticated user actually changes.
  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    supabase
      .from("profiles")
      .select("theme_preference")
      .eq("id", user.id)
      .single()
      .then(({ data }) => {
        if (cancelled) return;
        const pref = (data as any)?.theme_preference as string | null;
        if (pref === "light" || pref === "dark") {
          setTheme((current) => {
            if (current === pref) return current;
            localStorage.setItem("finapp-theme", pref);
            return pref;
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [user?.id]);

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
      if (user?.id) {
        (supabase as any)
          .from("profiles")
          .update({ theme_preference: next })
          .eq("id", user.id)
          .then(() => {});
      }
      return next;
    });
  }, [user?.id]);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
