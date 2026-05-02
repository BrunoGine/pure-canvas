import { useCallback, useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Crown, Trash2, Copy, Plus, Minus, ShieldCheck, X, Check, Trophy } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { GOAL_PRESETS, DEFAULT_PRESET } from "./goalPresets";
import SharedAmountDialog from "./SharedAmountDialog";
import {
  loadSharedGoalDetail,
  type SharedGoalSummary,
  type SharedGoal,
  type SharedGoalMember,
  type SharedJoinRequest,
  type SharedContribution,
} from "@/hooks/useSharedGoals";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Props {
  goal: SharedGoalSummary | null;
  onOpenChange: (v: boolean) => void;
  actions: {
    requestContribution: (g: SharedGoalSummary, amount: number) => Promise<void>;
    withdrawFromShared: (g: SharedGoal, amount: number) => Promise<void>;
    approveJoinRequest: (r: SharedJoinRequest) => Promise<void>;
    rejectJoinRequest: (r: SharedJoinRequest) => Promise<void>;
    approveContribution: (c: SharedContribution, g: SharedGoal) => Promise<void>;
    rejectContribution: (c: SharedContribution) => Promise<void>;
    removeMember: (m: SharedGoalMember) => Promise<void>;
    promoteMember: (m: SharedGoalMember) => Promise<void>;
    deleteSharedGoal: (g: SharedGoal) => Promise<void>;
  };
  refreshKey: number;
}

const formatBRL = (n: number) =>
  Number(n).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const SharedGoalDetailDialog = ({ goal, onOpenChange, actions, refreshKey }: Props) => {
  const [detail, setDetail] = useState<{
    goal: SharedGoal | null;
    members: SharedGoalMember[];
    joinRequests: SharedJoinRequest[];
    contributions: SharedContribution[];
  }>({ goal: null, members: [], joinRequests: [], contributions: [] });
  const [contribOpen, setContribOpen] = useState(false);
  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [localKey, setLocalKey] = useState(0);

  const reload = useCallback(async () => {
    if (!goal) return;
    const d = await loadSharedGoalDetail(goal.id);
    setDetail(d);
  }, [goal]);

  useEffect(() => {
    if (goal) reload();
  }, [goal, reload, refreshKey, localKey]);

  if (!goal) return null;
  const fresh = detail.goal ?? goal;
  const isAdmin = goal.my_role === "admin";
  const preset = GOAL_PRESETS.find((p) => p.key === fresh.preset_key) ?? DEFAULT_PRESET;
  const PresetIcon = preset.icon;
  const target = Number(fresh.target_amount);
  const current = Number(fresh.current_amount);
  const pct = Math.min(100, Math.round((current / target) * 100));

  const pendingContribs = detail.contributions.filter((c) => c.status === "pending");
  const approvedContribs = detail.contributions.filter((c) => c.status === "approved");
  const pendingTotal = detail.joinRequests.length + pendingContribs.length;

  const ranking = [...detail.members].sort(
    (a, b) => Number(b.total_contributed) - Number(a.total_contributed),
  );

  const copyCode = () => {
    navigator.clipboard.writeText(fresh.invite_code);
    toast.success("Código copiado!");
  };

  const after = async (fn: () => Promise<void>) => {
    await fn();
    setLocalKey((k) => k + 1);
  };

  return (
    <>
      <Dialog open={!!goal} onOpenChange={onOpenChange}>
        <DialogContent className="glass-card border-border/30 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="sr-only">{fresh.name}</DialogTitle>
          </DialogHeader>

          {/* Header banner */}
          <div className={cn("relative h-32 -mt-6 -mx-6 rounded-t-lg bg-gradient-to-br flex items-center justify-center", preset.gradient)}>
            <PresetIcon className="text-white/95 drop-shadow-lg" size={56} />
            <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="font-display text-xl font-bold text-white drop-shadow">{fresh.name}</h2>
            </div>
          </div>

          <Tabs defaultValue="summary" className="mt-2">
            <TabsList className="w-full grid grid-cols-5 h-auto">
              <TabsTrigger value="summary" className="text-xs">Resumo</TabsTrigger>
              <TabsTrigger value="members" className="text-xs">Membros</TabsTrigger>
              {isAdmin && (
                <TabsTrigger value="requests" className="text-xs relative">
                  Solicitações
                  {pendingTotal > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-[9px] rounded-full px-1.5 py-0.5 font-bold">
                      {pendingTotal}
                    </span>
                  )}
                </TabsTrigger>
              )}
              <TabsTrigger value="ranking" className="text-xs">Ranking</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">Histórico</TabsTrigger>
            </TabsList>

            {/* SUMMARY */}
            <TabsContent value="summary" className="space-y-4 mt-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-muted-foreground">Progresso</span>
                  <span className="text-sm font-bold text-primary">{pct}%</span>
                </div>
                <Progress value={pct} className="h-3" />
                <div className="flex justify-between text-xs text-muted-foreground mt-1 tabular-nums">
                  <span>R$ {formatBRL(current)}</span>
                  <span>R$ {formatBRL(target)}</span>
                </div>
              </div>

              <div className="rounded-xl border border-border/40 bg-secondary/20 p-4">
                <p className="text-xs text-muted-foreground mb-1">Código de convite</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="font-display text-2xl font-bold tracking-widest text-primary">{fresh.invite_code}</p>
                  <Button size="sm" variant="outline" onClick={copyCode} className="gap-1">
                    <Copy size={12} /> Copiar
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => setContribOpen(true)}
                  disabled={fresh.is_completed}
                  className="gradient-primary text-white border-0 gap-1"
                >
                  <Plus size={14} /> Contribuir
                </Button>
                {isAdmin && (
                  <Button
                    onClick={() => setWithdrawOpen(true)}
                    variant="outline"
                    disabled={current <= 0}
                    className="gap-1"
                  >
                    <Minus size={14} /> Retirar
                  </Button>
                )}
              </div>

              {isAdmin && (
                <Button variant="ghost" className="w-full text-destructive gap-1" onClick={() => setConfirmDelete(true)}>
                  <Trash2 size={14} /> Excluir vaquinha
                </Button>
              )}
            </TabsContent>

            {/* MEMBERS */}
            <TabsContent value="members" className="space-y-2 mt-4">
              {detail.members.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem membros ainda.</p>
              ) : (
                detail.members.map((m) => (
                  <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarImage src={m.avatar_url ?? undefined} />
                        <AvatarFallback>{(m.display_name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium flex items-center gap-1">
                          {m.display_name}
                          {m.role === "admin" && <Crown size={12} className="text-primary" />}
                        </p>
                        <p className="text-xs text-muted-foreground">R$ {formatBRL(Number(m.total_contributed))}</p>
                      </div>
                    </div>
                    {isAdmin && m.user_id !== fresh.created_by && (
                      <div className="flex items-center gap-1">
                        {m.role !== "admin" && (
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => after(() => actions.promoteMember(m))}
                            title="Promover a admin"
                          >
                            <ShieldCheck size={14} />
                          </Button>
                        )}
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => after(() => actions.removeMember(m))}
                          title="Remover"
                        >
                          <X size={14} />
                        </Button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </TabsContent>

            {/* REQUESTS (admin) */}
            {isAdmin && (
              <TabsContent value="requests" className="space-y-4 mt-4">
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Pedidos de entrada</h4>
                  {detail.joinRequests.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhum pedido pendente.</p>
                  ) : (
                    <div className="space-y-2">
                      {detail.joinRequests.map((r) => (
                        <div key={r.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{(r.display_name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{r.display_name}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(parseISO(r.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" className="text-primary" onClick={() => after(() => actions.approveJoinRequest(r))}>
                              <Check size={14} />
                            </Button>
                            <Button size="icon" variant="ghost" className="text-destructive" onClick={() => after(() => actions.rejectJoinRequest(r))}>
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Contribuições aguardando</h4>
                  {pendingContribs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">Nenhuma contribuição pendente.</p>
                  ) : (
                    <div className="space-y-2">
                      {pendingContribs.map((c) => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
                          <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9">
                              <AvatarFallback>{(c.display_name ?? "U").slice(0, 1).toUpperCase()}</AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="text-sm font-medium">{c.display_name}</p>
                              <p className="text-xs text-muted-foreground">R$ {formatBRL(Number(c.amount))}</p>
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-primary"
                              onClick={() => after(() => actions.approveContribution(c, fresh))}
                            >
                              <Check size={14} />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-destructive"
                              onClick={() => after(() => actions.rejectContribution(c))}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            )}

            {/* RANKING */}
            <TabsContent value="ranking" className="space-y-2 mt-4">
              {ranking.map((m, i) => (
                <div key={m.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
                  <div className="flex items-center gap-3">
                    <span className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold",
                      i === 0 && "bg-yellow-500/20 text-yellow-600",
                      i === 1 && "bg-slate-400/20 text-slate-500",
                      i === 2 && "bg-amber-700/20 text-amber-700",
                      i > 2 && "bg-secondary text-muted-foreground",
                    )}>
                      {i === 0 ? <Trophy size={14} /> : i + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium">{m.display_name}</p>
                    </div>
                  </div>
                  <span className="text-sm font-bold tabular-nums">R$ {formatBRL(Number(m.total_contributed))}</span>
                </div>
              ))}
            </TabsContent>

            {/* HISTORY */}
            <TabsContent value="history" className="space-y-2 mt-4">
              {approvedContribs.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">Sem movimentações ainda.</p>
              ) : (
                approvedContribs.map((c) => (
                  <div key={c.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-secondary/20 p-3">
                    <div>
                      <p className="text-sm font-medium">{c.display_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(c.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-primary tabular-nums">+ R$ {formatBRL(Number(c.amount))}</span>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <SharedAmountDialog
        open={contribOpen}
        title="Adicionar valor"
        description={isAdmin ? "Como admin, você precisará aprovar logo após." : "Sua contribuição precisará ser aprovada pelo admin."}
        cta="Enviar contribuição"
        onOpenChange={setContribOpen}
        onConfirm={async (v) => {
          await actions.requestContribution(goal, v);
          setLocalKey((k) => k + 1);
        }}
      />

      <SharedAmountDialog
        open={withdrawOpen}
        title="Retirar valor"
        description="O valor será creditado nas suas transações pessoais."
        cta="Retirar"
        max={current}
        onOpenChange={setWithdrawOpen}
        onConfirm={async (v) => {
          await actions.withdrawFromShared(fresh, v);
          setLocalKey((k) => k + 1);
        }}
      />

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="glass-card border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir vaquinha?</AlertDialogTitle>
            <AlertDialogDescription>
              {current > 0
                ? "Retire todo o saldo antes de excluir. A ação não pode ser desfeita."
                : "Esta ação não pode ser desfeita. Todos os membros perderão acesso."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                await actions.deleteSharedGoal(fresh);
                setConfirmDelete(false);
                onOpenChange(false);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SharedGoalDetailDialog;
