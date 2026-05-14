import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppMode = "personal" | "business";

export interface Company {
  id: string;
  user_id: string;
  name: string;
  business_type: string | null;
  segment: string | null;
  monthly_revenue: number | null;
  employees_count: number | null;
  main_goal: string | null;
}

interface CompanyContextValue {
  loading: boolean;
  mode: AppMode;
  companies: Company[];
  activeCompany: Company | null;
  activeCompanyId: string | null;
  enterBusinessMode: (companyId: string) => Promise<void>;
  exitBusinessMode: () => Promise<void>;
  refreshCompanies: () => Promise<void>;
  deleteCompany: (companyId: string) => Promise<void>;
}

const Ctx = createContext<CompanyContextValue>({
  loading: true,
  mode: "personal",
  companies: [],
  activeCompany: null,
  activeCompanyId: null,
  enterBusinessMode: async () => {},
  exitBusinessMode: async () => {},
  refreshCompanies: async () => {},
  deleteCompany: async () => {},
});

export const useCompany = () => useContext(Ctx);

const LS_MODE = "app_mode_v1";
const LS_ACTIVE = "active_company_id_v1";

export const CompanyProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompanyId, setActiveCompanyId] = useState<string | null>(() => {
    try { return localStorage.getItem(LS_ACTIVE); } catch { return null; }
  });
  const [mode, setMode] = useState<AppMode>(() => {
    try { return (localStorage.getItem(LS_MODE) as AppMode) || "personal"; } catch { return "personal"; }
  });
  const [loading, setLoading] = useState(true);

  const refreshCompanies = useCallback(async () => {
    if (!user) {
      setCompanies([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("companies")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    const list = (data || []) as Company[];
    setCompanies(list);

    // Load profile preference
    const { data: prof } = await supabase
      .from("profiles")
      .select("active_company_id")
      .eq("id", user.id)
      .maybeSingle();
    if (prof?.active_company_id && list.find((c) => c.id === prof.active_company_id)) {
      setActiveCompanyId(prof.active_company_id);
    } else if (activeCompanyId && !list.find((c) => c.id === activeCompanyId)) {
      setActiveCompanyId(null);
      setMode("personal");
    }
    setLoading(false);
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refreshCompanies(); }, [refreshCompanies]);

  useEffect(() => {
    try { localStorage.setItem(LS_MODE, mode); } catch { /* ignore */ }
  }, [mode]);
  useEffect(() => {
    try {
      if (activeCompanyId) localStorage.setItem(LS_ACTIVE, activeCompanyId);
      else localStorage.removeItem(LS_ACTIVE);
    } catch { /* ignore */ }
  }, [activeCompanyId]);

  const enterBusinessMode = useCallback(async (companyId: string) => {
    setActiveCompanyId(companyId);
    setMode("business");
    if (user) {
      await supabase.from("profiles").update({ active_company_id: companyId }).eq("id", user.id);
    }
  }, [user]);

  const exitBusinessMode = useCallback(async () => {
    setMode("personal");
  }, []);

  const deleteCompany = useCallback(async (companyId: string) => {
    if (!user) return;

    // Exit business mode if deleting the active one
    if (activeCompanyId === companyId) {
      setMode("personal");
      setActiveCompanyId(null);
      await supabase.from("profiles").update({ active_company_id: null }).eq("id", user.id);
    }

    // Delete chat messages tied to conversations of this company
    const { data: convs } = await supabase
      .from("conversations")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", companyId);
    const convIds = (convs || []).map((c) => c.id);
    if (convIds.length > 0) {
      await supabase.from("chat_messages").delete().in("conversation_id", convIds);
    }

    // Delete related data scoped by user_id + company_id
    await Promise.all([
      supabase.from("manual_transactions").delete().eq("user_id", user.id).eq("company_id", companyId),
      supabase.from("recurring_transactions").delete().eq("user_id", user.id).eq("company_id", companyId),
      supabase.from("budgets").delete().eq("user_id", user.id).eq("company_id", companyId),
      supabase.from("credit_cards").delete().eq("user_id", user.id).eq("company_id", companyId),
      supabase.from("goals").delete().eq("user_id", user.id).eq("company_id", companyId),
      supabase.from("conversations").delete().eq("user_id", user.id).eq("company_id", companyId),
    ]);

    // Finally delete the company
    await supabase.from("companies").delete().eq("id", companyId).eq("user_id", user.id);

    await refreshCompanies();
  }, [user, activeCompanyId, refreshCompanies]);

  const activeCompany = companies.find((c) => c.id === activeCompanyId) || null;
  const effectiveMode: AppMode = mode === "business" && activeCompany ? "business" : "personal";
  const effectiveActiveId = effectiveMode === "business" ? activeCompanyId : null;

  return (
    <Ctx.Provider
      value={{
        loading,
        mode: effectiveMode,
        companies,
        activeCompany: effectiveMode === "business" ? activeCompany : null,
        activeCompanyId: effectiveActiveId,
        enterBusinessMode,
        exitBusinessMode,
        refreshCompanies,
        deleteCompany,
      }}
    >
      {children}
    </Ctx.Provider>
  );
};
