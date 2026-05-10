import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { toast } from "sonner";

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  brand: string;
  closing_day: number;
  color: string;
}

// Module-level pub/sub so all hook instances stay in sync
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

export function useCreditCards() {
  const { user } = useAuth();
  const { activeCompanyId, mode } = useCompany();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!user) return;
    let q = supabase
      .from("credit_cards")
      .select("id, name, bank, brand, closing_day, color")
      .eq("user_id", user.id);
    q = mode === "business" && activeCompanyId
      ? q.eq("company_id", activeCompanyId)
      : q.is("company_id", null);
    const { data, error } = await q.order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cards:", error);
      toast.error("Erro ao carregar cartões");
    } else {
      setCards(data || []);
    }
    setLoading(false);
  }, [user, mode, activeCompanyId]);

  useEffect(() => {
    setLoading(true);
    fetchCards();
    const l = () => fetchCards();
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, [fetchCards]);

  const addCard = useCallback(
    async (card: Omit<CreditCard, "id">) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("credit_cards")
        .insert({
          user_id: user.id,
          company_id: mode === "business" ? activeCompanyId : null,
          name: card.name,
          bank: card.bank,
          brand: card.brand,
          closing_day: card.closing_day,
          color: card.color,
        })
        .select("id, name, bank, brand, closing_day, color")
        .single();

      if (error) {
        console.error("Error adding card:", error);
        toast.error("Erro ao adicionar cartão");
      } else if (data) {
        toast.success("Cartão adicionado");
        notify();
      }
    },
    [user, mode, activeCompanyId]
  );

  const updateCard = useCallback(
    async (id: string, patch: Partial<Omit<CreditCard, "id">>) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("credit_cards")
        .update({
          ...(patch.name !== undefined && { name: patch.name }),
          ...(patch.bank !== undefined && { bank: patch.bank }),
          ...(patch.brand !== undefined && { brand: patch.brand }),
          ...(patch.closing_day !== undefined && { closing_day: patch.closing_day }),
          ...(patch.color !== undefined && { color: patch.color }),
        })
        .eq("id", id)
        .select("id, name, bank, brand, closing_day, color")
        .single();
      if (error) {
        toast.error("Erro ao atualizar cartão");
      } else if (data) {
        toast.success("Cartão atualizado");
        notify();
      }
    },
    [user],
  );

  const removeCard = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from("credit_cards").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao remover cartão");
      } else {
        toast.success("Cartão removido");
        notify();
      }
    },
    [user]
  );

  return { cards, loading, addCard, updateCard, removeCard };
}
