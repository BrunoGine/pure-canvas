import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type TicketStatus = "open" | "awaiting_user" | "awaiting_admin" | "resolved" | "closed";
export type TicketPriority = "low" | "normal" | "high" | "urgent";
export type TicketCategory = "technical" | "financial" | "account" | "company" | "harp" | "suggestion" | "other";

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  last_message_at: string;
  created_at: string;
  updated_at: string;
}

export const useSupportTickets = (opts?: { admin?: boolean }) => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = useCallback(async () => {
    if (!user) {
      setTickets([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    let q = (supabase as any).from("support_tickets").select("*").order("last_message_at", { ascending: false });
    if (!opts?.admin) q = q.eq("user_id", user.id);
    const { data, error } = await q;
    if (!error) setTickets((data || []) as SupportTicket[]);
    setLoading(false);
  }, [user?.id, opts?.admin]);

  useEffect(() => { fetchTickets(); }, [fetchTickets]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel(`tickets-${opts?.admin ? "admin" : user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "support_tickets" }, () => fetchTickets())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, opts?.admin, fetchTickets]);

  const createTicket = async (input: { subject: string; category: TicketCategory; message: string }) => {
    if (!user) throw new Error("Not authenticated");
    const { data: ticket, error } = await (supabase as any)
      .from("support_tickets")
      .insert({ user_id: user.id, subject: input.subject, category: input.category })
      .select()
      .single();
    if (error) throw error;
    const { error: msgErr } = await (supabase as any)
      .from("support_messages")
      .insert({ ticket_id: ticket.id, sender_id: user.id, sender_role: "user", message: input.message });
    if (msgErr) throw msgErr;

    // Fire-and-forget email notification
    supabase.functions.invoke("send-transactional-email", {
      body: {
        templateName: "ticket-created",
        recipientEmail: user.email,
        idempotencyKey: `ticket-created-${ticket.id}`,
        templateData: { subject: input.subject, ticketId: ticket.id, userName: user.user_metadata?.display_name || "Usuário" },
      },
    }).catch(() => {});

    await fetchTickets();
    return ticket as SupportTicket;
  };

  const updateStatus = async (ticketId: string, status: TicketStatus) => {
    const { error } = await (supabase as any).from("support_tickets").update({ status }).eq("id", ticketId);
    if (error) throw error;
    await fetchTickets();
  };

  return { tickets, loading, createTicket, updateStatus, refetch: fetchTickets };
};
