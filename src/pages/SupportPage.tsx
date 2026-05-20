import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Plus, MessageSquare, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useSupportTickets } from "@/hooks/useSupportTickets";
import { StatusBadge, PriorityBadge } from "@/components/support/StatusBadge";
import { NewTicketDialog } from "@/components/support/NewTicketDialog";
import { TicketChat } from "@/components/support/TicketChat";
import { supabase } from "@/integrations/supabase/client";

const SupportPage = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { tickets, loading, updateStatus } = useSupportTickets();
  const [openNew, setOpenNew] = useState(false);

  const current = tickets.find((t) => t.id === ticketId);

  const markResolved = async () => {
    if (!current) return;
    await updateStatus(current.id, "resolved");
  };

  if (ticketId && current) {
    return (
      <div className="space-y-4 pb-24">
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => navigate("/suporte")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft size={16} /> Voltar
          </button>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={current.priority} />
            <StatusBadge status={current.status} />
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4">
          <h1 className="font-display text-lg font-bold">{current.subject}</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Aberto em {new Date(current.created_at).toLocaleString("pt-BR")}
          </p>
        </div>

        <div className="glass-card rounded-2xl p-3">
          <TicketChat ticketId={current.id} disabled={current.status === "closed"} />
        </div>

        {current.status !== "resolved" && current.status !== "closed" && (
          <Button variant="outline" className="w-full" onClick={markResolved}>
            <CheckCircle2 size={16} /> Marcar como resolvido
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <button onClick={() => navigate("/perfil")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
            <ArrowLeft size={14} /> Perfil
          </button>
          <h1 className="font-display text-2xl font-bold">Suporte</h1>
          <p className="text-sm text-muted-foreground mt-1">Tire dúvidas e abra chamados</p>
        </div>
        <Button onClick={() => setOpenNew(true)}>
          <Plus size={16} /> Novo
        </Button>
      </div>

      {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}

      {!loading && tickets.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center space-y-3">
          <MessageSquare size={32} className="mx-auto text-muted-foreground" />
          <div>
            <p className="font-medium">Nenhum chamado ainda</p>
            <p className="text-sm text-muted-foreground">Abra um chamado e nossa equipe responderá em breve.</p>
          </div>
          <Button onClick={() => setOpenNew(true)}><Plus size={16} /> Abrir chamado</Button>
        </div>
      )}

      <div className="space-y-2">
        {tickets.map((t, i) => (
          <motion.button
            key={t.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            onClick={() => navigate(`/suporte/${t.id}`)}
            className="w-full text-left glass-card rounded-xl p-4 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Atualizado {new Date(t.last_message_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      <NewTicketDialog
        open={openNew}
        onOpenChange={setOpenNew}
        onCreated={(id) => navigate(`/suporte/${id}`)}
      />
    </div>
  );
};

export default SupportPage;
