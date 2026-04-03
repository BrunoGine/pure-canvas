import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface BankConnection {
  id: string;
  pluggy_item_id: string;
  institution_name: string | null;
  status: string;
  created_at: string;
}

export interface BankAccount {
  id: string;
  connection_id: string;
  name: string;
  balance: number;
  account_type: string;
  currency: string;
}

export interface BankTransaction {
  id: string;
  connection_id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: string;
}

export const useBankConnections = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank_connections", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_connections")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BankConnection[];
    },
    enabled: !!user,
  });
};

export const useBankAccounts = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank_accounts", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .order("name");
      if (error) throw error;
      return data as BankAccount[];
    },
    enabled: !!user,
  });
};

export const useBankTransactions = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["bank_transactions", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bank_transactions")
        .select("*")
        .order("date", { ascending: false });
      if (error) throw error;
      return data as BankTransaction[];
    },
    enabled: !!user,
  });
};

export const useCreateConnectToken = () => {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke("pluggy-api", {
        body: { action: "create_connect_token" },
      });
      if (error) throw error;
      return data.connectToken as string;
    },
    onError: (err: Error) => {
      toast.error("Erro ao conectar banco: " + err.message);
    },
  });
};

export const useSyncItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      const { data, error } = await supabase.functions.invoke("pluggy-api", {
        body: { action: "sync_item", itemId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bank_connections"] });
      queryClient.invalidateQueries({ queryKey: ["bank_accounts"] });
      queryClient.invalidateQueries({ queryKey: ["bank_transactions"] });
      toast.success("Dados bancários sincronizados!");
    },
    onError: (err: Error) => {
      toast.error("Erro ao sincronizar: " + err.message);
    },
  });
};
