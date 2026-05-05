import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string | null;
  card_id?: string | null;
  payment_method?: string | null;
}

export function useTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTransactions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("manual_transactions")
      .select("id, description, amount, type, category, date, notes, card_id, payment_method")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching transactions:", error);
      toast.error("Erro ao carregar transações");
    } else {
      setTransactions(
        (data || []).map((t) => ({
          ...t,
          type: t.type as "income" | "expense",
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const addTransaction = useCallback(
    async (tx: Omit<Transaction, "id">) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("manual_transactions")
        .insert({
          user_id: user.id,
          description: tx.description,
          amount: tx.amount,
          type: tx.type,
          category: tx.category,
          date: tx.date,
          notes: tx.notes || null,
          card_id: tx.card_id || null,
          payment_method: tx.payment_method || "pix",
        })
        .select("id, description, amount, type, category, date, notes, card_id, payment_method")
        .single();

      if (error) {
        console.error("Error adding transaction:", error);
        toast.error("Erro ao adicionar transação");
      } else if (data) {
        setTransactions((prev) => [
          { ...data, type: data.type as "income" | "expense" },
          ...prev,
        ]);
      }
    },
    [user]
  );

  const updateTransaction = useCallback(
    async (id: string, patch: Partial<Omit<Transaction, "id">>) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("manual_transactions")
        .update({
          ...(patch.description !== undefined && { description: patch.description }),
          ...(patch.amount !== undefined && { amount: patch.amount }),
          ...(patch.type !== undefined && { type: patch.type }),
          ...(patch.category !== undefined && { category: patch.category }),
          ...(patch.date !== undefined && { date: patch.date }),
          ...(patch.notes !== undefined && { notes: patch.notes || null }),
          ...(patch.card_id !== undefined && { card_id: patch.card_id || null }),
          ...(patch.payment_method !== undefined && { payment_method: patch.payment_method || "pix" }),
        })
        .eq("id", id)
        .select("id, description, amount, type, category, date, notes, card_id, payment_method")
        .single();
      if (error) {
        toast.error("Erro ao atualizar transação");
      } else if (data) {
        setTransactions((prev) =>
          prev.map((t) => (t.id === id ? { ...data, type: data.type as "income" | "expense" } : t)),
        );
        toast.success("Transação atualizada");
      }
    },
    [user],
  );

  const removeTransaction = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase
        .from("manual_transactions")
        .delete()
        .eq("id", id);

      if (error) {
        console.error("Error removing transaction:", error);
        toast.error("Erro ao remover transação");
      } else {
        setTransactions((prev) => prev.filter((t) => t.id !== id));
      }
    },
    [user]
  );

  return { transactions, loading, addTransaction, updateTransaction, removeTransaction };
}
