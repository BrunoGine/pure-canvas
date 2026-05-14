import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSupportMessages } from "@/hooks/useSupportMessages";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Props {
  ticketId: string;
  isAdmin?: boolean;
  disabled?: boolean;
}

export const TicketChat = ({ ticketId, isAdmin, disabled }: Props) => {
  const { user } = useAuth();
  const { messages, loading, sending, send } = useSupportMessages(ticketId, { isAdmin });
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const onSend = async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await send(text);
  };

  return (
    <div className="flex flex-col h-full min-h-[400px]">
      <div className="flex-1 overflow-y-auto space-y-3 p-3 bg-secondary/20 rounded-xl border border-border/40">
        {loading && <div className="text-sm text-muted-foreground text-center py-4">Carregando...</div>}
        {!loading && messages.length === 0 && (
          <div className="text-sm text-muted-foreground text-center py-4">Nenhuma mensagem ainda.</div>
        )}
        {messages.map((m) => {
          const mine = m.sender_id === user?.id;
          const adminMsg = m.sender_role === "admin";
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
                  mine
                    ? "bg-primary text-primary-foreground rounded-br-sm"
                    : adminMsg
                      ? "bg-card border border-primary/30 rounded-bl-sm"
                      : "bg-card border border-border/50 rounded-bl-sm"
                }`}
              >
                {!mine && (
                  <div className="text-[10px] uppercase tracking-wide opacity-70 mb-0.5">
                    {adminMsg ? "Suporte" : "Usuário"}
                  </div>
                )}
                <div>{m.message}</div>
                <div className={`text-[10px] mt-1 ${mine ? "opacity-70" : "text-muted-foreground"}`}>
                  {new Date(m.created_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                </div>
              </div>
            </motion.div>
          );
        })}
        <div ref={endRef} />
      </div>

      {!disabled && (
        <div className="mt-3 flex items-end gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            placeholder="Escreva sua mensagem..."
            rows={2}
            className="resize-none"
          />
          <Button onClick={onSend} disabled={sending || !input.trim()} size="icon">
            <Send size={16} />
          </Button>
        </div>
      )}
    </div>
  );
};
