import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Send, Bot, Sparkles, Plus, History, ChevronLeft, Trash2, Building2 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useCompany } from "@/contexts/CompanyContext";
import { useHarpContext } from "@/hooks/useHarpContext";
import { QuickChips } from "@/components/chat/QuickChips";
import { TypingIndicator } from "@/components/chat/TypingIndicator";

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

const personalSuggestions = [
  "Onde gasto mais?",
  "Resumo do mês",
  "Como economizar?",
  "Meu orçamento está saudável?",
  "Quanto estou guardando em metas?",
];

const businessSuggestions = [
  "Analisar fluxo de caixa",
  "Lucro do mês",
  "Maior despesa",
  "Como melhorar minha margem?",
  "Qual categoria mais cresceu?",
];

const ChatPage = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const { mode, activeCompany } = useCompany();
  const harpContext = useHarpContext();
  const isBusiness = mode === "business" && !!activeCompany;
  const suggestions = isBusiness ? businessSuggestions : personalSuggestions;
  const location = useLocation();
  const navigate = useNavigate();
  const lessonContext = (location.state as any)?.lessonContext as
    | { lesson_id: string; lesson_title: string; youtube_url: string }
    | undefined;
  const initialPrompt = (location.state as any)?.initialPrompt as string | undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Manter foco no input
  useEffect(() => {
    if (!showHistory && !isTyping) inputRef.current?.focus();
  }, [showHistory, isTyping, currentConversationId]);

  useEffect(() => {
    if (lessonContext && messages.length === 0) {
      const autoMsg = `Vamos aprofundar a aula "${lessonContext.lesson_title}". Pode me explicar os pontos principais?`;
      send(autoMsg);
      navigate(location.pathname, { replace: true, state: {} });
    } else if (initialPrompt && messages.length === 0) {
      setInput(initialPrompt);
      navigate(location.pathname, { replace: true, state: {} });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeCompanyId = isBusiness ? activeCompany!.id : null;

  const loadConversations = useCallback(async () => {
    if (!user) return;
    let query = (supabase as any)
      .from("conversations")
      .select("*")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false });
    query = activeCompanyId
      ? query.eq("company_id", activeCompanyId)
      : query.is("company_id", null);
    const { data, error } = await query;
    if (!error && data) setConversations(data as Conversation[]);
  }, [user, activeCompanyId]);

  useEffect(() => {
    loadConversations();
    setMessages([]);
    setCurrentConversationId(null);
  }, [loadConversations]);

  const loadMessages = async (conversationId: string) => {
    const { data, error } = await (supabase as any)
      .from("chat_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    if (!error && data) setMessages(data as Message[]);
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
      let convId = currentConversationId;
      if (!convId) {
        const title = msg.length > 40 ? msg.slice(0, 40) + "..." : msg;
        const { data: conv, error: convErr } = await (supabase as any)
          .from("conversations")
          .insert({ user_id: user.id, title, company_id: activeCompanyId })
          .select("id")
          .single();
        if (convErr || !conv) throw convErr;
        convId = conv.id;
        setCurrentConversationId(convId);
      }

      await (supabase as any).from("chat_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "user",
        content: msg,
      });

      const { data, error } = await supabase.functions.invoke("harp-ia-chat", {
        body: { messages: updatedMessages, lessonContext, context: harpContext },
      });

      if (error) throw error;

      const reply = data?.reply || "Desculpe, não consegui processar sua pergunta. Tente novamente.";
      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);

      await (supabase as any).from("chat_messages").insert({
        conversation_id: convId,
        user_id: user.id,
        role: "assistant",
        content: reply,
      });

      await (supabase as any)
        .from("conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", convId);
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

  if (showHistory) {
    return (
      <div className="flex flex-col h-[calc(100dvh-10rem)]">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="mb-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setShowHistory(false)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
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
              <motion.div key={conv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
                <div
                  className={`glass-card rounded-xl cursor-pointer hover:glow-border transition-all duration-300 ${
                    currentConversationId === conv.id ? "glow-border" : ""
                  }`}
                  onClick={() => loadMessages(conv.id)}
                >
                  <div className="p-3 flex items-center justify-between">
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
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>

        <div className="pt-3 pb-1">
          <button
            onClick={startNewChat}
            className="w-full py-2.5 rounded-xl gradient-primary text-white font-medium text-sm flex items-center justify-center gap-2 shadow-glow hover:shadow-elevated transition-all duration-300"
          >
            <Plus size={16} /> Nova Conversa
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100dvh-10rem)]">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4 flex items-center justify-between"
      >
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Sparkles size={22} className="text-primary" /> Harp.I.A
          </h1>
          <p className="text-muted-foreground text-sm">
            {isBusiness ? "Consultora financeira da sua empresa" : "Sua assistente financeira pessoal"}
          </p>
          {isBusiness && (
            <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[hsl(var(--business-primary))/0.15] text-[hsl(var(--business-primary))]">
              <Building2 size={11} /> {activeCompany!.name}
            </div>
          )}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => setShowHistory(true)}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title="Histórico"
          >
            <History size={18} className="text-muted-foreground" />
          </button>
          <button
            onClick={startNewChat}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title="Nova conversa"
          >
            <Plus size={18} className="text-muted-foreground" />
          </button>
        </div>
      </motion.div>

      <div className="flex-1 overflow-y-auto space-y-5 pr-1">
        {messages.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4 pt-6">
            <div className="text-center space-y-2">
              <div className="mx-auto w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
                <Bot size={28} className="text-white relative z-10" />
              </div>
              <h3 className="font-display font-semibold">Olá! Sou a Harp.I.A 🤖</h3>
              <p className="text-sm text-muted-foreground px-4">
                {isBusiness
                  ? "Posso analisar fluxo de caixa, margem, despesas e metas da sua empresa."
                  : harpContext.hasData
                    ? "Pergunte sobre seus gastos, metas, orçamento ou educação financeira."
                    : "Adicione transações para que eu possa analisar suas finanças."}
              </p>
            </div>
          </motion.div>
        )}

        {messages.map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "items-start"}`}
          >
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 mt-0.5 shadow-glow">
                <Bot size={16} className="text-white" />
              </div>
            )}
            {msg.role === "assistant" ? (
              <div className="flex-1 min-w-0 prose prose-sm dark:prose-invert max-w-none
                prose-headings:font-display prose-headings:font-semibold
                prose-h2:text-base prose-h2:mt-6 prose-h2:mb-3 prose-h2:first:mt-0
                prose-h3:text-sm prose-h3:mt-5 prose-h3:mb-2
                prose-p:my-3 prose-p:leading-relaxed prose-p:text-foreground
                prose-li:my-1 prose-li:text-foreground
                prose-ul:my-3 prose-ol:my-3 prose-ul:pl-5 prose-ol:pl-5
                prose-strong:text-foreground prose-strong:font-semibold
                prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground prose-blockquote:my-3
                prose-hr:my-5 prose-table:text-xs
                space-y-1">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            ) : (
              <div className="max-w-[85%] rounded-2xl rounded-br-md px-4 py-2.5 text-sm gradient-primary text-white shadow-glow whitespace-pre-wrap">
                {msg.content}
              </div>
            )}
          </motion.div>
        ))}

        {isTyping && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>

      <div className="pt-3 pb-1 space-y-2">
        <QuickChips suggestions={suggestions} onPick={send} disabled={isTyping} />
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder={isBusiness ? "Pergunte sobre seu negócio..." : "Pergunte sobre suas finanças..."}
            className="rounded-xl bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-glow transition-all"
          />
          <button
            onClick={() => send()}
            disabled={!input.trim() || isTyping}
            className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shrink-0 text-white disabled:opacity-40 transition-all shadow-glow hover:shadow-elevated"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
