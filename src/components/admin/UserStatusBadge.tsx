import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type AccountStatus = "active" | "suspended" | "banned" | "deleted";

const map: Record<AccountStatus, { label: string; className: string }> = {
  active: { label: "Ativo", className: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30" },
  suspended: { label: "Suspenso", className: "bg-amber-500/15 text-amber-600 border-amber-500/30" },
  banned: { label: "Banido", className: "bg-destructive/15 text-destructive border-destructive/30" },
  deleted: { label: "Excluído", className: "bg-muted text-muted-foreground border-border" },
};

const UserStatusBadge = ({ status }: { status: AccountStatus }) => {
  const m = map[status] ?? map.active;
  return (
    <Badge variant="outline" className={cn("font-medium", m.className)}>
      {m.label}
    </Badge>
  );
};

export default UserStatusBadge;
