import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export interface Budget {
  id: string;
  category: string;
  limit_amount: number;
  period: string;
}

const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function useBudgets() {
  const { user } = useAuth();
  const { activeCompanyId, mode } = useCompany();
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBudgets = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("budgets")
      .select("id, category, limit_amount, period")
      .eq("user_id", user.id);
    q = mode === "business" && activeCompanyId
      ? q.eq("company_id", activeCompanyId)
      : q.is("company_id", null);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) {
      toast.error("Erro ao carregar orçamentos");
    } else {
      setBudgets((data || []).map((b) => ({ ...b, limit_amount: Number(b.limit_amount) })));
    }
    setLoading(false);
  }, [user, mode, activeCompanyId]);

  useEffect(() => {
    fetchBudgets();
    const l = () => fetchBudgets();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [fetchBudgets]);

  const addBudget = useCallback(
    async (input: { category: string; limit_amount: number }) => {
      if (!user) return;
      if (!input.category || !(input.limit_amount > 0)) {
        toast.error("Dados inválidos");
        return;
      }
      const { error } = await supabase.from("budgets").insert({
        user_id: user.id,
        company_id: mode === "business" ? activeCompanyId : null,
        category: input.category,
        limit_amount: input.limit_amount,
      });
      if (error) {
        if (error.code === "23505") toast.error("Já existe um orçamento para essa categoria");
        else toast.error("Erro ao criar orçamento");
        return;
      }
      toast.success("Orçamento criado");
      notify();
    },
    [user, mode, activeCompanyId],
  );

  const updateBudget = useCallback(
    async (id: string, patch: Partial<Pick<Budget, "category" | "limit_amount">>) => {
      if (!user) return;
      if (patch.limit_amount !== undefined && !(patch.limit_amount > 0)) {
        toast.error("Valor inválido");
        return;
      }
      const { error } = await supabase.from("budgets").update(patch).eq("id", id);
      if (error) {
        if (error.code === "23505") toast.error("Já existe um orçamento para essa categoria");
        else toast.error("Erro ao atualizar orçamento");
        return;
      }
      toast.success("Orçamento atualizado");
      notify();
    },
    [user],
  );

  const removeBudget = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from("budgets").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao excluir orçamento");
        return;
      }
      toast.success("Orçamento excluído");
      notify();
    },
    [user],
  );

  return { budgets, loading, addBudget, updateBudget, removeBudget };
}
