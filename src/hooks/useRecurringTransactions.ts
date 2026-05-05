import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  notes?: string | null;
  day_of_month: number;
  active: boolean;
  payment_method?: string | null;
  card_id?: string | null;
  last_executed_at?: string | null;
}

export function useRecurringTransactions() {
  const { user } = useAuth();
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecurring = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("id, description, amount, type, category, notes, day_of_month, active, payment_method, card_id, last_executed_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching recurring:", error);
      toast.error("Erro ao carregar recorrências");
    } else {
      setRecurringTransactions(
        (data || []).map((r) => ({ ...r, type: r.type as "income" | "expense" }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRecurring();
  }, [fetchRecurring]);

  const addRecurring = useCallback(
    async (tx: Omit<RecurringTransaction, "id" | "active">) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("recurring_transactions")
        .insert({
          user_id: user.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          notes: tx.notes || null,
          day_of_month: tx.day_of_month,
          payment_method: tx.payment_method || "pix",
          card_id: tx.card_id || null,
        })
        .select("id, description, amount, type, category, notes, day_of_month, active, payment_method, card_id, last_executed_at")
        .single();

      if (error) {
        console.error("Error adding recurring:", error);
        toast.error("Erro ao criar recorrência");
      } else if (data) {
        setRecurringTransactions((prev) => [
          { ...data, type: data.type as "income" | "expense" },
          ...prev,
        ]);
        toast.success("Transação recorrente criada!");
      }
    },
    [user]
  );

  const removeRecurring = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("recurring_transactions")
        .delete()
        .eq("id", id);

      if (error) {
        toast.error("Erro ao remover recorrência");
      } else {
        setRecurringTransactions((prev) => prev.filter((r) => r.id !== id));
      }
    },
    [user]
  );

  const toggleRecurring = useCallback(
    async (id: string, active: boolean) => {
      const { error } = await supabase
        .from("recurring_transactions")
        .update({ active })
        .eq("id", id);

      if (error) {
        toast.error("Erro ao atualizar recorrência");
      } else {
        setRecurringTransactions((prev) =>
          prev.map((r) => (r.id === id ? { ...r, active } : r))
        );
      }
    },
    []
  );

  const updateRecurring = useCallback(
    async (id: string, patch: Partial<Omit<RecurringTransaction, "id" | "active" | "last_executed_at">>) => {
      const { data, error } = await supabase
        .from("recurring_transactions")
        .update({
          ...(patch.description !== undefined && { description: patch.description }),
          ...(patch.amount !== undefined && { amount: patch.amount }),
          ...(patch.type !== undefined && { type: patch.type }),
          ...(patch.category !== undefined && { category: patch.category }),
          ...(patch.notes !== undefined && { notes: patch.notes || null }),
          ...(patch.day_of_month !== undefined && { day_of_month: patch.day_of_month }),
          ...(patch.payment_method !== undefined && { payment_method: patch.payment_method || "pix" }),
          ...(patch.card_id !== undefined && { card_id: patch.card_id || null }),
        })
        .eq("id", id)
        .select("id, description, amount, type, category, notes, day_of_month, active, payment_method, card_id, last_executed_at")
        .single();
      if (error) {
        toast.error("Erro ao atualizar recorrência");
      } else if (data) {
        setRecurringTransactions((prev) =>
          prev.map((r) => (r.id === id ? { ...data, type: data.type as "income" | "expense" } : r)),
        );
        toast.success("Recorrência atualizada");
      }
    },
    [],
  );

  return { recurringTransactions, loading, addRecurring, removeRecurring, toggleRecurring, updateRecurring };
}
