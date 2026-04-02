import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, Plus, History, ChevronLeft, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const suggestions = [
  "Como criar uma reserva de emergência?",
  "O que é renda fixa?",
  "Como sair das dívidas?",
  "Quanto investir por mês?",
];

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data, error } = await (supabase as any)
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    if (!error && data) setConversations(data as Conversation[]);
  }, [user]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await (supabase as any)
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (!error && data) {
      setMessages(data as Message[]);
    }
    setCurrentConversationId(conversationId);
    setShowHistory(false);
  };

  const startNewChat = () => {
    setMessages([]);
    setCurrentConversationId(null);
    setShowHistory(false);
  };

  const deleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const { error } = await (supabase as any).from("conversations").delete().eq("id", id);
    if (error) {
      toast({ title: "Erro", description: "Não foi possível excluir a conversa.", variant: "destructive" });
      return;
    }
    if (currentConversationId === id) startNewChat();
    loadConversations();
  };

  const send = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || isTyping || !user) return;

    const userMsg: Message = { role: "user", content: msg };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setIsTyping(true);

    try {
      // Create conversation if new
      let convId = currentConversationId;
      if (!convId) {
        const title = msg.length > 40 ? msg.slice(0, 40) + "..." : msg;
        const { data: conv, error: convErr } = await (supabase as any)
          .from("conversations")
          .insert({ user_id: user.id, title })
          .select("id")
          .single();
        if (convErr || !conv) throw convErr;
        convId = conv.id;
        setCurrentConversationId(convId);
      }

      // Save user message
      await (supabase as any).from("chat_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: msg,
      });

      // Call AI
      const { data, error } = await supabase.functions.invoke("harp-ia-chat", {
        body: { messages: updatedMessages },
      });

      if (error) throw error;

      const reply = data?.reply || "Desculpe, não consegui processar sua pergunta. Tente novamente.";
      setMessages(prev => [...prev, { role: "assistant", content: reply }]);

      // Save assistant message
      await supabase.from("chat_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: reply,
      });

      // Update conversation timestamp
      await supabase.from("conversations").update({ updated_at: new Date().toISOString() }).eq("id", convId);
      loadConversations();
    } catch (error) {
      console.error("Error calling Harp.I.A:", error);
      toast({
        title: "Erro",
        description: "Não foi possível obter resposta. Tente novamente.",
        variant: "destructive",
      });
      setMessages(messages);
    } finally {
      setIsTyping(false);
    }
  };

  // History sidebar view
  if (showHistory) {
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-full hover:bg-muted transition-colors">
              <ChevronLeft size={20} />
            </button>
            <h1 className="font-display text-xl font-bold">Histórico de Conversas</h1>
          </div>
        </motion.div>

        <div className="flex-1 overflow-y-auto space-y-2">
          {conversations.length === 0 ? (
            <div className="text-center pt-12 text-muted-foreground text-sm">
              <History size={40} className="mx-auto mb-3 opacity-40" />
              <p>Nenhuma conversa ainda.</p>
              <p>Comece uma nova conversa com a Harp.I.A!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <motion.div
                key={conv.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card
                  className={`shadow-card cursor-pointer hover:shadow-elevated transition-shadow ${
                    currentConversationId === conv.id ? "ring-2 ring-primary" : ""
                  }`}
                  onClick={() => loadMessages(conv.id)}
                >
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{conv.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.updated_at).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteConversation(conv.id, e)}
                      className="p-1.5 rounded-full hover:bg-destructive/10 hover:text-destructive transition-colors shrink-0 ml-2"
                    >
                      <Trash2 size={14} />
                    </button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        <div className="pt-3 pb-1">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 rounded-full gradient-primary text-primary-foreground font-medium text-sm flex items-center justify-center gap-2"
          >
            <Plus size={16} /> Nova Conversa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles size={22} className="text-primary" /> Harp.I.A
          </h1>
          <p className="text-muted-foreground text-sm">Seu assistente de educação financeira</p>
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Histórico"
          >
            <History size={18} className="text-muted-foreground" />
          </button>
          <button
            onClick={startNewChat}
            className="p-2 rounded-full hover:bg-muted transition-colors"
            title="Nova conversa"
          >
            <Plus size={18} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-8">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-elevated">
                <Bot size={28} className="text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold">Olá! Sou a Harp.I.A 🤖</h3>
              <p className="text-sm text-muted-foreground">Especialista em educação financeira. Como posso ajudar?</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {suggestions.map((s, i) => (
                <Card
                  key={i}
                  className="shadow-card cursor-pointer hover:shadow-elevated transition-shadow"
                  onClick={() => send(s)}
                >
                  <CardContent className="p-3">
                    <p className="text-xs font-medium">{s}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}
          >
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shrink-0 mt-1">
                <Bot size={14} className="text-primary-foreground" />
              </div>
            )}
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${
                msg.role === "user"
                  ? "gradient-primary text-primary-foreground rounded-br-md"
                  : "bg-muted rounded-bl-md"
              }`}
            >
              {msg.role === "assistant" ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_table]:text-xs [&_h2]:text-base [&_h3]:text-sm [&_p]:text-sm [&_li]:text-sm">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                msg.content
              )}
            </div>
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0 mt-1">
                <User size={14} className="text-muted-foreground" />
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && (
          <div className="flex gap-2">
            <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center shrink-0">
              <Bot size={14} className="text-primary-foreground" />
            </div>
            <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="pt-3 pb-1">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && send()}
            placeholder="Pergunte sobre finanças..."
            className="rounded-full"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center shrink-0 text-primary-foreground disabled:opacity-40 transition-opacity"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
