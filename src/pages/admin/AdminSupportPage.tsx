import { useMemo, useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Filter, CheckCircle2, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useSupportTickets, type TicketStatus } from "@/hooks/useSupportTickets";
import { StatusBadge, PriorityBadge } from "@/components/support/StatusBadge";
import { TicketChat } from "@/components/support/TicketChat";
import { supabase } from "@/integrations/supabase/client";

const AdminSupportPage = () => {
  const navigate = useNavigate();
  const { ticketId } = useParams();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { tickets, loading, updateStatus } = useSupportTickets({ admin: true });

  const [status, setStatus] = useState<string>("all");
  const [priority, setPriority] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null }>>({});

  useEffect(() => {
    if (!tickets.length) return;
    const ids = Array.from(new Set(tickets.map((t) => t.user_id)));
    supabase.from("profiles").select("id, display_name").in("id", ids).then(({ data }) => {
      const map: Record<string, { display_name: string | null }> = {};
      (data || []).forEach((p: any) => { map[p.id] = { display_name: p.display_name }; });
      setProfiles(map);
    });
  }, [tickets]);

  const filtered = useMemo(() => tickets.filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (priority !== "all" && t.priority !== priority) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [tickets, status, priority, search]);

  const counts = useMemo(() => ({
    open: tickets.filter((t) => t.status === "awaiting_admin" || t.status === "open").length,
    waiting: tickets.filter((t) => t.status === "awaiting_user").length,
    resolved: tickets.filter((t) => t.status === "resolved").length,
  }), [tickets]);

  if (adminLoading) return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  if (!isAdmin) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="font-medium">Acesso negado</p>
        <p className="text-sm text-muted-foreground">Esta área é restrita a administradores.</p>
        <Button onClick={() => navigate("/")} variant="outline">Voltar</Button>
      </div>
    );
  }

  const current = tickets.find((t) => t.id === ticketId);

  if (current) {
    const owner = profiles[current.user_id];
    return (
      <div className="space-y-4 pb-24">
        <button onClick={() => navigate("/admin/suporte")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft size={16} /> Todos os tickets
        </button>

        <div className="glass-card rounded-2xl p-4 space-y-3">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-lg font-bold">{current.subject}</h1>
              <p className="text-xs text-muted-foreground mt-1">
                {owner?.display_name || "Usuário"} • {new Date(current.created_at).toLocaleString("pt-BR")}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1.5">
              <PriorityBadge priority={current.priority} />
              <StatusBadge status={current.status} />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Select value={current.status} onValueChange={(v) => updateStatus(current.id, v as TicketStatus)}>
              <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="awaiting_admin">Aguardando suporte</SelectItem>
                <SelectItem value="awaiting_user">Aguardando usuário</SelectItem>
                <SelectItem value="resolved">Resolvido</SelectItem>
                <SelectItem value="closed">Fechado</SelectItem>
              </SelectContent>
            </Select>
            <Button size="sm" variant="outline" onClick={() => updateStatus(current.id, "resolved")}>
              <CheckCircle2 size={14} /> Resolver
            </Button>
            <Button size="sm" variant="outline" onClick={() => updateStatus(current.id, "closed")}>
              <XCircle size={14} /> Fechar
            </Button>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-3">
          <TicketChat ticketId={current.id} isAdmin disabled={current.status === "closed"} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      <div>
        <button onClick={() => navigate("/")} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-2">
          <ArrowLeft size={14} /> Início
        </button>
        <h1 className="font-display text-2xl font-bold">Suporte — Admin</h1>
        <p className="text-sm text-muted-foreground mt-1">Gerencie todos os tickets</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Abertos</p>
          <p className="text-xl font-bold text-amber-500">{counts.open}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Aguardando</p>
          <p className="text-xl font-bold text-blue-500">{counts.waiting}</p>
        </div>
        <div className="glass-card rounded-xl p-3 text-center">
          <p className="text-xs text-muted-foreground">Resolvidos</p>
          <p className="text-xl font-bold text-emerald-500">{counts.resolved}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Filter size={12} /> Filtros:</div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos status</SelectItem>
            <SelectItem value="awaiting_admin">Aguardando suporte</SelectItem>
            <SelectItem value="awaiting_user">Aguardando usuário</SelectItem>
            <SelectItem value="resolved">Resolvido</SelectItem>
            <SelectItem value="closed">Fechado</SelectItem>
          </SelectContent>
        </Select>
        <Select value={priority} onValueChange={setPriority}>
          <SelectTrigger className="w-[150px] h-9"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas prioridades</SelectItem>
            <SelectItem value="urgent">Urgente</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Baixa</SelectItem>
          </SelectContent>
        </Select>
        <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar assunto..." className="h-9 max-w-[220px]" />
      </div>

      {loading && <div className="text-sm text-muted-foreground">Carregando...</div>}

      {!loading && filtered.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center">
          <MessageSquare size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">Nenhum ticket encontrado.</p>
        </div>
      )}

      <div className="space-y-2">
        {filtered.map((t) => (
          <button
            key={t.id}
            onClick={() => navigate(`/admin/suporte/${t.id}`)}
            className="w-full text-left glass-card rounded-xl p-4 hover:bg-primary/5 transition-colors"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{t.subject}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {profiles[t.user_id]?.display_name || "Usuário"} • {new Date(t.last_message_at).toLocaleString("pt-BR")}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <StatusBadge status={t.status} />
                <PriorityBadge priority={t.priority} />
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminSupportPage;
