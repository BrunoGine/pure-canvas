import { useNavigate } from "react-router-dom";
import AdminShell from "@/components/admin/AdminShell";
import AdminRoute from "@/components/admin/AdminRoute";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAdminLogs } from "@/hooks/useAdminLogs";

const fmt = (s: string) =>
  new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

const ACTION_LABELS: Record<string, string> = {
  grant_override: "Concedeu cortesia",
  revoke_override: "Revogou cortesia",
  suspend_user: "Suspendeu usuário",
  ban_user: "Baniu usuário",
  restore_user: "Reativou usuário",
  soft_delete_user: "Excluiu (soft)",
  hard_delete_user: "Excluiu permanente",
  revoke_sessions: "Revogou sessões",
};

const ACTION_TONE: Record<string, string> = {
  ban_user: "bg-destructive/15 text-destructive border-destructive/30",
  hard_delete_user: "bg-destructive/15 text-destructive border-destructive/30",
  suspend_user: "bg-amber-500/15 text-amber-600 border-amber-500/30",
  soft_delete_user: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

const AdminLogsPage = () => {
  const { data, isLoading } = useAdminLogs(200);
  const navigate = useNavigate();
  return (
    <AdminRoute>
      <AdminShell title="Logs administrativos">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
          </div>
        ) : data?.length === 0 ? (
          <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum log ainda.</Card>
        ) : (
          <div className="space-y-2">
            {data?.map((l) => (
              <Card
                key={l.id}
                className="p-3 border-border/60 cursor-pointer hover:bg-muted/40"
                onClick={() => l.target_user_id && navigate(`/admin/usuarios/${l.target_user_id}`)}
              >
                <div className="flex items-start justify-between gap-2">
                  <Badge variant="outline" className={ACTION_TONE[l.action] ?? ""}>
                    {ACTION_LABELS[l.action] ?? l.action}
                  </Badge>
                  <span className="text-[11px] text-muted-foreground whitespace-nowrap">{fmt(l.created_at)}</span>
                </div>
                {l.metadata && Object.keys(l.metadata).length > 0 && (
                  <p className="mt-2 text-[11px] font-mono text-muted-foreground break-all">
                    {JSON.stringify(l.metadata)}
                  </p>
                )}
              </Card>
            ))}
          </div>
        )}
      </AdminShell>
    </AdminRoute>
  );
};

export default AdminLogsPage;
