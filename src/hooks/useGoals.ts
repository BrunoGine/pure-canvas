import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export type GoalType = "target" | "monthly";

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  goal_type: GoalType;
  target_amount: number | null;
  monthly_target_amount: number | null;
  current_amount: number;
  deadline: string | null;
  image_url: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  /** Derived: contributed in current month (only meaningful for monthly goals) */
  month_contributed?: number;
}

export interface NewGoalInput {
  name: string;
  goal_type: GoalType;
  target_amount?: number | null;
  monthly_target_amount?: number | null;
  deadline?: string | null;
  image_url?: string | null;
}

export interface RecurringContribution {
  day_of_month: number;
  amount: number;
}

export function useGoals() {
  const { user } = useAuth();
  const { activeCompanyId, mode } = useCompany();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id);
    q = mode === "business" && activeCompanyId
      ? q.eq("company_id", activeCompanyId)
      : q.is("company_id", null);
    const { data, error } = await q.order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar metas");
      setLoading(false);
      return;
    }
    const rows = (data ?? []) as Goal[];

    // Compute month contribution for monthly goals (single query)
    const monthlyIds = rows.filter((g) => g.goal_type === "monthly").map((g) => g.id);
    const monthMap = new Map<string, number>();
    if (monthlyIds.length > 0) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1).toISOString().split("T")[0];
      const { data: txs } = await supabase
        .from("manual_transactions")
        .select("goal_id, amount, type")
        .eq("user_id", user.id)
        .in("goal_id", monthlyIds)
        .gte("date", start)
        .lt("date", end);
      (txs ?? []).forEach((t: any) => {
        const sign = t.type === "expense" ? 1 : -1; // contributions are expenses; withdrawals are income
        monthMap.set(t.goal_id, (monthMap.get(t.goal_id) || 0) + sign * Number(t.amount));
      });
    }

    setGoals(
      rows.map((g) => ({
        ...g,
        month_contributed: g.goal_type === "monthly" ? Math.max(0, monthMap.get(g.id) || 0) : undefined,
      })),
    );
    setLoading(false);
  }, [user, mode, activeCompanyId]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(
    async (input: NewGoalInput) => {
      if (!user) return null;
      if (!input.name.trim()) {
        toast.error("Preencha o nome da meta");
        return null;
      }
      if (input.goal_type === "target" && (!input.target_amount || input.target_amount <= 0)) {
        toast.error("Informe um valor objetivo válido");
        return null;
      }
      if (
        input.goal_type === "monthly" &&
        (!input.monthly_target_amount || input.monthly_target_amount <= 0)
      ) {
        toast.error("Informe um valor mensal válido");
        return null;
      }
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          company_id: mode === "business" ? activeCompanyId : null,
          name: input.name.trim(),
          goal_type: input.goal_type,
          target_amount: input.goal_type === "target" ? input.target_amount! : null,
          monthly_target_amount:
            input.goal_type === "monthly" ? input.monthly_target_amount! : null,
          deadline: input.deadline || null,
          image_url: input.image_url || null,
        })
        .select("*")
        .single();
      if (error) {
        console.error(error);
        toast.error("Erro ao criar meta");
        return null;
      }
      const newGoal = { ...(data as Goal), month_contributed: data.goal_type === "monthly" ? 0 : undefined };
      setGoals((prev) => [newGoal, ...prev]);
      toast.success("Meta criada!");
      return newGoal;
    },
    [user, mode, activeCompanyId],
  );

  const updateGoalRow = (g: Goal) =>
    setGoals((prev) => prev.map((x) => (x.id === g.id ? { ...x, ...g } : x)));

  const contributeToGoal = useCallback(
    async (
      goal: Goal,
      amount: number,
      recurring?: RecurringContribution | null,
    ) => {
      if (!user) return;
      if (amount <= 0) {
        toast.error("Valor inválido");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { error: txErr } = await supabase.from("manual_transactions").insert({
        user_id: user.id,
        description: `Contribuição: ${goal.name}`,
        amount,
        type: "expense",
        category: "Meta",
        date: today,
        payment_method: "pix",
        goal_id: goal.id,
      });
      if (txErr) {
        console.error(txErr);
        toast.error("Erro ao registrar transação");
        return;
      }

      const newAmount = Number(goal.current_amount) + amount;
      const { data: updated, error: upErr } = await supabase
        .from("goals")
        .update({ current_amount: newAmount })
        .eq("id", goal.id)
        .select("*")
        .single();
      if (upErr) {
        console.error(upErr);
        toast.error("Erro ao atualizar meta");
        return;
      }

      if (recurring && recurring.amount > 0) {
        await supabase.from("recurring_transactions").insert({
          user_id: user.id,
          description: `Contribuição: ${goal.name}`,
          amount: recurring.amount,
          type: "expense",
          category: "Meta",
          day_of_month: recurring.day_of_month,
          payment_method: "pix",
          goal_id: goal.id,
        });
        toast.success("Contribuição recorrente criada!");
      }

      const u = updated as Goal;
      const wasCompleted = goal.is_completed;
      const merged: Goal = {
        ...u,
        month_contributed:
          u.goal_type === "monthly" ? (goal.month_contributed || 0) + amount : undefined,
      };
      updateGoalRow(merged);
      if (u.goal_type === "target" && !wasCompleted && u.is_completed) {
        setJustCompleted(merged);
        await supabase
          .from("recurring_transactions")
          .update({ active: false })
          .eq("goal_id", goal.id);
      } else {
        toast.success("Valor adicionado!");
      }
    },
    [user],
  );

  const withdrawFromGoal = useCallback(
    async (goal: Goal, amount: number) => {
      if (!user) return;
      if (amount <= 0) {
        toast.error("Valor inválido");
        return;
      }
      if (amount > Number(goal.current_amount)) {
        toast.error("Valor maior que o disponível na meta");
        return;
      }

      const today = new Date().toISOString().split("T")[0];
      const { error: txErr } = await supabase.from("manual_transactions").insert({
        user_id: user.id,
        description: `Retirada da meta: ${goal.name}`,
        amount,
        type: "income",
        category: "Meta",
        date: today,
        payment_method: "pix",
        goal_id: goal.id,
      });
      if (txErr) {
        toast.error("Erro ao registrar retirada");
        return;
      }
      const newAmount = Math.max(0, Number(goal.current_amount) - amount);
      const { data: updated, error } = await supabase
        .from("goals")
        .update({ current_amount: newAmount })
        .eq("id", goal.id)
        .select("*")
        .single();
      if (error) {
        toast.error("Erro ao atualizar meta");
        return;
      }
      const u = updated as Goal;
      updateGoalRow({
        ...u,
        month_contributed:
          u.goal_type === "monthly"
            ? Math.max(0, (goal.month_contributed || 0) - amount)
            : undefined,
      });
      toast.success("Valor retirado");
    },
    [user],
  );

  const deleteGoal = useCallback(
    async (goal: Goal) => {
      if (!user) return;
      const remaining = Number(goal.current_amount);
      if (remaining > 0) {
        const today = new Date().toISOString().split("T")[0];
        await supabase.from("manual_transactions").insert({
          user_id: user.id,
          description: `Cancelamento da meta: ${goal.name}`,
          amount: remaining,
          type: "income",
          category: "Meta",
          date: today,
          payment_method: "pix",
          goal_id: goal.id,
        });
      }
      await supabase.from("recurring_transactions").delete().eq("goal_id", goal.id);
      const { error } = await supabase.from("goals").delete().eq("id", goal.id);
      if (error) {
        toast.error("Erro ao excluir meta");
        return;
      }
      setGoals((prev) => prev.filter((g) => g.id !== goal.id));
      toast.success("Meta excluída");
    },
    [user],
  );

  const dismissCompleted = useCallback(() => setJustCompleted(null), []);

  return {
    goals,
    loading,
    addGoal,
    contributeToGoal,
    withdrawFromGoal,
    deleteGoal,
    justCompleted,
    dismissCompleted,
    refresh: fetchGoals,
  };
}
