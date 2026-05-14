import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: "user" | "admin";
  message: string;
  created_at: string;
}

export const useSupportMessages = (ticketId: string | undefined, opts?: { isAdmin?: boolean }) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<SupportMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = useCallback(async () => {
    if (!ticketId) return;
    setLoading(true);
    const { data } = await (supabase as any)
      .from("support_messages")
      .select("*")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true });
    setMessages((data || []) as SupportMessage[]);
    setLoading(false);
  }, [ticketId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  useEffect(() => {
    if (!ticketId) return;
    const channel = supabase
      .channel(`ticket-msgs-${ticketId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "support_messages", filter: `ticket_id=eq.${ticketId}` },
        (payload) => setMessages((m) => [...m, payload.new as SupportMessage]),
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [ticketId]);

  const send = async (message: string) => {
    if (!user || !ticketId || !message.trim()) return;
    setSending(true);
    try {
      const role = opts?.isAdmin ? "admin" : "user";
      const { data: msg, error } = await (supabase as any)
        .from("support_messages")
        .insert({ ticket_id: ticketId, sender_id: user.id, sender_role: role, message: message.trim() })
        .select()
        .single();
      if (error) throw error;

      // If admin replied → notify ticket owner
      if (opts?.isAdmin) {
        const { data: ticket } = await (supabase as any)
          .from("support_tickets")
          .select("user_id, subject")
          .eq("id", ticketId)
          .single();
        if (ticket) {
          const { data: profile } = await supabase
            .from("profiles")
            .select("display_name")
            .eq("id", ticket.user_id)
            .maybeSingle();
          // Get user email via auth (admin only via RPC would be needed; skip if unavailable).
          // Frontend cannot read auth.users directly; rely on edge function to look up via service role if needed.
          supabase.functions.invoke("send-transactional-email", {
            body: {
              templateName: "ticket-reply",
              recipientUserId: ticket.user_id,
              idempotencyKey: `ticket-reply-${msg.id}`,
              templateData: { subject: ticket.subject, ticketId, userName: profile?.display_name || "Usuário", message: message.trim() },
            },
          }).catch(() => {});
        }
      }
    } finally {
      setSending(false);
    }
  };

  return { messages, loading, sending, send, refetch: fetchMessages };
};
