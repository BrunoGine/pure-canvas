import { Badge } from "@/components/ui/badge";
import type { TicketStatus, TicketPriority } from "@/hooks/useSupportTickets";

const STATUS_LABEL: Record<TicketStatus, string> = {
  open: "Aberto",
  awaiting_admin: "Aguardando suporte",
  awaiting_user: "Aguardando você",
  resolved: "Resolvido",
  closed: "Fechado",
};

const STATUS_CLASS: Record<TicketStatus, string> = {
  open: "bg-primary/15 text-primary border-primary/30",
  awaiting_admin: "bg-amber-500/15 text-amber-500 border-amber-500/30",
  awaiting_user: "bg-blue-500/15 text-blue-500 border-blue-500/30",
  resolved: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
  closed: "bg-muted text-muted-foreground border-border",
};

export const StatusBadge = ({ status }: { status: TicketStatus }) => (
  <Badge variant="outline" className={STATUS_CLASS[status]}>{STATUS_LABEL[status]}</Badge>
);

const PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Baixa", normal: "Normal", high: "Alta", urgent: "Urgente",
};
const PRIORITY_CLASS: Record<TicketPriority, string> = {
  low: "bg-muted text-muted-foreground border-border",
  normal: "bg-secondary text-secondary-foreground border-border",
  high: "bg-orange-500/15 text-orange-500 border-orange-500/30",
  urgent: "bg-destructive/15 text-destructive border-destructive/30",
};
export const PriorityBadge = ({ priority }: { priority: TicketPriority }) => (
  <Badge variant="outline" className={PRIORITY_CLASS[priority]}>{PRIORITY_LABEL[priority]}</Badge>
);
