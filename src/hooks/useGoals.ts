import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Goal {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline: string | null;
  image_url: string | null;
  is_completed: boolean;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NewGoalInput {
  name: string;
  target_amount: number;
  deadline?: string | null;
  image_url?: string | null;
}

export interface RecurringContribution {
  day_of_month: number;
  amount: number;
}

export function useGoals() {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);
  const [justCompleted, setJustCompleted] = useState<Goal | null>(null);

  const fetchGoals = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) {
      console.error(error);
      toast.error("Erro ao carregar metas");
    } else {
      setGoals((data ?? []) as Goal[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const addGoal = useCallback(
    async (input: NewGoalInput) => {
      if (!user) return null;
      if (!input.name.trim() || input.target_amount <= 0) {
        toast.error("Preencha nome e valor objetivo válidos");
        return null;
      }
      const { data, error } = await supabase
        .from("goals")
        .insert({
          user_id: user.id,
          name: input.name.trim(),
          target_amount: input.target_amount,
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
      setGoals((prev) => [data as Goal, ...prev]);
      toast.success("Meta criada!");
      return data as Goal;
    },
    [user],
  );

  const updateGoalRow = (g: Goal) =>
    setGoals((prev) => prev.map((x) => (x.id === g.id ? g : x)));

  const checkCompletion = (g: Goal) => {
    if (g.is_completed && !goals.find((x) => x.id === g.id)?.is_completed) {
      setJustCompleted(g);
    } else if (g.is_completed) {
      // also fire if newly transitioned
      const prev = goals.find((x) => x.id === g.id);
      if (prev && !prev.is_completed) setJustCompleted(g);
    }
  };

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

      // 1. Create transaction (expense)
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

      // 2. Update goal current_amount
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

      // 3. Optional recurring
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
      updateGoalRow(u);
      if (!wasCompleted && u.is_completed) {
        setJustCompleted(u);
        // Disable recurring when completed
        await supabase
          .from("recurring_transactions")
          .update({ active: false })
          .eq("goal_id", goal.id);
      } else {
        toast.success("Valor adicionado!");
      }
    },
    [user, goals],
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
      updateGoalRow(updated as Goal);
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
      // Remove related recurrings then the goal
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
