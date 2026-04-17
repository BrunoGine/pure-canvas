import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface CreditCard {
  id: string;
  name: string;
  bank: string;
  brand: string;
  closing_day: number;
  color: string;
}

export function useCreditCards() {
  const { user } = useAuth();
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCards = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("credit_cards")
      .select("id, name, bank, brand, closing_day, color")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching cards:", error);
      toast.error("Erro ao carregar cartões");
    } else {
      setCards(data || []);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const addCard = useCallback(
    async (card: Omit<CreditCard, "id">) => {
      if (!user) return;
      const { data, error } = await supabase
        .from("credit_cards")
        .insert({
          user_id: user.id,
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
        setCards((prev) => [data, ...prev]);
        toast.success("Cartão adicionado");
      }
    },
    [user]
  );

  const removeCard = useCallback(
    async (id: string) => {
      if (!user) return;
      const { error } = await supabase.from("credit_cards").delete().eq("id", id);
      if (error) {
        toast.error("Erro ao remover cartão");
      } else {
        setCards((prev) => prev.filter((c) => c.id !== id));
        toast.success("Cartão removido");
      }
    },
    [user]
  );

  return { cards, loading, addCard, removeCard };
}
