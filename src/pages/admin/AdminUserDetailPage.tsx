import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ShieldAlert, Ban, Trash2, RotateCcw, LogOut, Crown, Gift, X, Loader2, Calendar,
} from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AdminRoute from "@/components/admin/AdminRoute";
import UserStatusBadge from "@/components/admin/UserStatusBadge";
import PlanBadge from "@/components/admin/PlanBadge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAdminUserDetail } from "@/hooks/useAdminUserDetail";
import { useAdminUserMutations } from "@/hooks/useAdminUserMutations";

const DURATION_OPTIONS = [
  { label: "7 dias", value: "7" },
  { label: "30 dias", value: "30" },
  { label: "60 dias", value: "60" },
  { label: "90 dias", value: "90" },
  { label: "1 ano", value: "365" },
  { label: "Vitalício", value: "0" },
];
const REASONS = ["Beta tester", "Influenciador", "Compensação", "Parceiro", "Promoção", "Outro"];

const fmt = (s: string | null | undefined) =>
  s ? new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const ActionConfirm = ({
  open, onOpenChange, title, description, confirmText, requireText, onConfirm, destructive,
}: {
  open: boolean; onOpenChange: (b: boolean) => void;
  title: string; description: string; confirmText: string;
  requireText?: string; onConfirm: (reason: string) => void; destructive?: boolean;
}) => {
  const [typed, setTyped] = useState("");
  const [reason, setReason] = useState("");
  const ok = !requireText || typed === requireText;
  return (
    <AlertDialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) { setTyped(""); setReason(""); } }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">Motivo (opcional)</Label>
            <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={2} />
          </div>
          {requireText && (
            <div>
              <Label className="text-xs">
                Digite <span className="font-mono">{requireText}</span> para confirmar
              </Label>
              <Input value={typed} onChange={(e) => setTyped(e.target.value)} />
            </div>
          )}
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            disabled={!ok}
            onClick={() => onConfirm(reason)}
            className={destructive ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useAdminUserDetail(id);
  const m = useAdminUserMutations();

  const [grantPlan, setGrantPlan] = useState<"premium" | "enterprise">("premium");
  const [grantDuration, setGrantDuration] = useState("30");
  const [grantReason, setGrantReason] = useState("Beta tester");
  const [grantReasonText, setGrantReasonText] = useState("");

  const [confirm, setConfirm] = useState<{ kind: string } | null>(null);

  if (isLoading) {
    return (
      <AdminRoute>
        <AdminShell title="Usuário">
          <Skeleton className="h-32 w-full" />
        </AdminShell>
      </AdminRoute>
    );
  }

  const profile = data?.profile;
  if (!profile) {
    return (
      <AdminRoute>
        <AdminShell title="Usuário">
          <Card className="p-6 text-center text-sm text-muted-foreground">Usuário não encontrado.</Card>
        </AdminShell>
      </AdminRoute>
    );
  }

  const status = profile.account_status as any;
  const email = profile.email as string;
  const userId = id!;
  const activeOverride = data.active_override;
  const overrideHistory = (data.override_history ?? []) as any[];
  const counts = data.counts ?? {};
  const logs = (data.admin_logs ?? []) as any[];

  return (
    <AdminRoute>
      <AdminShell title={profile.display_name || "Usuário"}>
        <Card className="p-4 border-border/60">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base font-semibold truncate">{profile.display_name || "Sem nome"}</h2>
              <p className="text-xs text-muted-foreground break-all">{email}</p>
              <p className="text-[11px] text-muted-foreground mt-1">ID: {userId}</p>
            </div>
            <div className="flex flex-col items-end gap-1">
              <UserStatusBadge status={status} />
              <PlanBadge plan={data.effective_plan} />
            </div>
          </div>
          {profile.status_reason && status !== "active" && (
            <div className="mt-3 rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">
              <span className="text-muted-foreground">Motivo: </span>{profile.status_reason}
            </div>
          )}

          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Transações</p>
              <p className="text-sm font-semibold">{counts.transactions ?? 0}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Metas</p>
              <p className="text-sm font-semibold">{counts.goals ?? 0}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Empresas</p>
              <p className="text-sm font-semibold">{counts.companies ?? 0}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Logins</p>
              <p className="text-sm font-semibold">{profile.login_count ?? 0}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Tickets</p>
              <p className="text-sm font-semibold">{counts.tickets ?? 0}</p>
            </div>
            <div className="rounded-md bg-muted/30 p-2">
              <p className="text-[10px] uppercase text-muted-foreground">Certificados</p>
              <p className="text-sm font-semibold">{counts.certificates ?? 0}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
            <span className="text-muted-foreground">Criado em:</span><span>{fmt(profile.created_at)}</span>
            <span className="text-muted-foreground">Último acesso:</span><span>{fmt(profile.last_seen_at)}</span>
            <span className="text-muted-foreground">Onboarding:</span><span>{profile.onboarding_completed ? "Sim" : "Não"}</span>
            <span className="text-muted-foreground">Sub Stripe:</span><span>{data.subscription?.status ?? "—"}</span>
            {data.subscription?.trial_ends_at && (<><span className="text-muted-foreground">Trial até:</span><span>{fmt(data.subscription.trial_ends_at)}</span></>)}
          </div>
        </Card>

        {/* Status actions */}
        <Card className="mt-4 p-4 border-border/60">
          <h3 className="text-sm font-semibold mb-3">Status da conta</h3>
          <div className="grid grid-cols-2 gap-2">
            {status !== "active" && (
              <Button variant="outline" onClick={() => setConfirm({ kind: "restore" })}>
                <RotateCcw className="mr-2 h-4 w-4" /> Reativar
              </Button>
            )}
            {status === "active" && (
              <Button variant="outline" onClick={() => setConfirm({ kind: "suspend" })}>
                <ShieldAlert className="mr-2 h-4 w-4" /> Suspender
              </Button>
            )}
            {status !== "banned" && (
              <Button variant="outline" onClick={() => setConfirm({ kind: "ban" })}>
                <Ban className="mr-2 h-4 w-4" /> Banir
              </Button>
            )}
            <Button variant="outline" onClick={() => setConfirm({ kind: "revoke" })}>
              <LogOut className="mr-2 h-4 w-4" /> Revogar sessões
            </Button>
            {status !== "deleted" && (
              <Button variant="outline" onClick={() => setConfirm({ kind: "soft_delete" })}>
                <Trash2 className="mr-2 h-4 w-4" /> Excluir (soft)
              </Button>
            )}
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
              onClick={() => setConfirm({ kind: "hard_delete" })}
            >
              <Trash2 className="mr-2 h-4 w-4" /> Excluir permanente
            </Button>
          </div>
        </Card>

        {/* Subscription override */}
        <Card className="mt-4 p-4 border-border/60">
          <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <Crown className="h-4 w-4" /> Cortesia / Assinatura manual
          </h3>
          {activeOverride && (
            <div className="mb-3 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <PlanBadge plan={activeOverride.plan_type} />
                  <p className="mt-1 text-muted-foreground">
                    {activeOverride.expires_at ? `Expira em ${fmt(activeOverride.expires_at)}` : "Vitalício"}
                  </p>
                  {activeOverride.reason && <p className="mt-1">Motivo: {activeOverride.reason}</p>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => m.revokeOverride.mutate({ overrideId: activeOverride.id, userId })}
                  disabled={m.revokeOverride.isPending}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Plano</Label>
              <Select value={grantPlan} onValueChange={(v: any) => setGrantPlan(v)}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="premium">Premium</SelectItem>
                  <SelectItem value="enterprise">Empresa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Duração</Label>
              <Select value={grantDuration} onValueChange={setGrantDuration}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map((d) => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mt-2">
            <Label className="text-xs">Motivo</Label>
            <Select value={grantReason} onValueChange={setGrantReason}>
              <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
            {grantReason === "Outro" && (
              <Input
                className="mt-2"
                placeholder="Descreva o motivo"
                value={grantReasonText}
                onChange={(e) => setGrantReasonText(e.target.value)}
              />
            )}
          </div>
          <Button
            className="mt-3 w-full"
            onClick={() => {
              const dur = Number(grantDuration);
              m.grantOverride.mutate({
                userId,
                plan: grantPlan,
                durationDays: dur === 0 ? null : dur,
                reason: grantReason === "Outro" ? grantReasonText : grantReason,
              });
            }}
            disabled={m.grantOverride.isPending}
          >
            {m.grantOverride.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Gift className="mr-2 h-4 w-4" />Conceder</>}
          </Button>

          {overrideHistory.length > 0 && (
            <div className="mt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">Histórico</p>
              <div className="space-y-1.5">
                {overrideHistory.map((o: any) => (
                  <div key={o.id} className="flex items-center justify-between rounded-md bg-muted/30 px-2 py-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <PlanBadge plan={o.plan_type} />
                      <span className="text-muted-foreground">
                        {o.active ? "Ativa" : o.revoked_at ? `Revogada ${fmt(o.revoked_at)}` : "Inativa"}
                      </span>
                    </div>
                    <span className="text-muted-foreground"><Calendar className="inline h-3 w-3 mr-1" />{fmt(o.created_at)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Recent admin actions */}
        {logs.length > 0 && (
          <Card className="mt-4 p-4 border-border/60">
            <h3 className="text-sm font-semibold mb-3">Histórico admin</h3>
            <div className="space-y-1.5">
              {logs.map((l: any) => (
                <div key={l.id} className="flex items-center justify-between text-xs">
                  <span className="font-mono">{l.action}</span>
                  <span className="text-muted-foreground">{fmt(l.created_at)}</span>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Confirmation dialogs */}
        {confirm?.kind === "suspend" && (
          <ActionConfirm
            open onOpenChange={() => setConfirm(null)}
            title="Suspender usuário?"
            description="O usuário será bloqueado de usar o app, mas os dados serão preservados."
            confirmText="Suspender"
            onConfirm={(reason) => { m.setStatus.mutate({ userId, status: "suspended", reason }); setConfirm(null); }}
          />
        )}
        {confirm?.kind === "ban" && (
          <ActionConfirm
            open onOpenChange={() => setConfirm(null)}
            title="Banir usuário?"
            description="Acesso será permanentemente bloqueado. Esta ação é severa."
            confirmText="Banir" destructive
            requireText={email}
            onConfirm={(reason) => { m.setStatus.mutate({ userId, status: "banned", reason }); setConfirm(null); }}
          />
        )}
        {confirm?.kind === "restore" && (
          <ActionConfirm
            open onOpenChange={() => setConfirm(null)}
            title="Reativar conta?"
            description="A conta volta ao status ativo e o usuário poderá usar o app normalmente."
            confirmText="Reativar"
            onConfirm={(reason) => { m.setStatus.mutate({ userId, status: "active", reason }); setConfirm(null); }}
          />
        )}
        {confirm?.kind === "revoke" && (
          <ActionConfirm
            open onOpenChange={() => setConfirm(null)}
            title="Revogar todas as sessões?"
            description="O usuário será deslogado de todos os dispositivos."
            confirmText="Revogar"
            onConfirm={() => { m.revokeSessions.mutate({ userId }); setConfirm(null); }}
          />
        )}
        {confirm?.kind === "soft_delete" && (
          <ActionConfirm
            open onOpenChange={() => setConfirm(null)}
            title="Excluir conta (soft)?"
            description="A conta fica invisível mas os dados são preservados para auditoria."
            confirmText="Excluir" destructive
            onConfirm={(reason) => { m.setStatus.mutate({ userId, status: "deleted", reason }); setConfirm(null); }}
          />
        )}
        {confirm?.kind === "hard_delete" && (
          <ActionConfirm
            open onOpenChange={() => setConfirm(null)}
            title="Excluir permanentemente?"
            description="Esta ação remove a conta e cascateia em dados pessoais. Não pode ser desfeita."
            confirmText="Excluir permanente" destructive
            requireText={email}
            onConfirm={(reason) => { m.hardDelete.mutate({ userId, reason }, { onSuccess: () => navigate("/admin/usuarios") }); setConfirm(null); }}
          />
        )}
      </AdminShell>
    </AdminRoute>
  );
};

export default AdminUserDetailPage;
