import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronLeft, ChevronRight, Filter } from "lucide-react";
import AdminShell from "@/components/admin/AdminShell";
import AdminRoute from "@/components/admin/AdminRoute";
import UserStatusBadge, { AccountStatus } from "@/components/admin/UserStatusBadge";
import PlanBadge from "@/components/admin/PlanBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAdminUsers } from "@/hooks/useAdminUsers";
import { PlanKey } from "@/lib/plans";

const PAGE_SIZE = 25;

const useDebounced = <T,>(value: T, ms = 300) => {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
};

const fmtDateTime = (s: string | null) =>
  s ? new Date(s).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }) : "—";

const daysSince = (s: string | null) => {
  if (!s) return null;
  return Math.floor((Date.now() - new Date(s).getTime()) / 86_400_000);
};

const AdminUsersPage = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();

  const search = params.get("q") ?? "";
  const status = (params.get("status") ?? "") as AccountStatus | "";
  const plan = (params.get("plan") ?? "") as PlanKey | "";
  const inactive = params.get("inactive") ?? "";
  const page = Number(params.get("page") ?? 0);

  const debouncedSearch = useDebounced(search, 300);

  const { data, isLoading, isFetching, error } = useAdminUsers({
    search: debouncedSearch,
    status,
    plan,
    inactiveDays: inactive ? Number(inactive) : null,
    page,
    pageSize: PAGE_SIZE,
  });

  const update = (patch: Record<string, string | null>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => {
      if (v === null || v === "") next.delete(k);
      else next.set(k, v);
    });
    if (!("page" in patch)) next.delete("page");
    setParams(next, { replace: true });
  };

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <AdminRoute>
      <AdminShell title="Usuários">
        <Card className="p-3 space-y-3 border-border/60">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome ou email…"
              value={search}
              onChange={(e) => update({ q: e.target.value })}
              className="pl-9"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Select value={status || "all"} onValueChange={(v) => update({ status: v === "all" ? null : v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Status: todos</SelectItem>
                <SelectItem value="active">Ativo</SelectItem>
                <SelectItem value="suspended">Suspenso</SelectItem>
                <SelectItem value="banned">Banido</SelectItem>
                <SelectItem value="deleted">Excluído</SelectItem>
              </SelectContent>
            </Select>
            <Select value={plan || "all"} onValueChange={(v) => update({ plan: v === "all" ? null : v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Plano" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Plano: todos</SelectItem>
                <SelectItem value="free">Free</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
                <SelectItem value="enterprise">Empresa</SelectItem>
              </SelectContent>
            </Select>
            <Select value={inactive || "all"} onValueChange={(v) => update({ inactive: v === "all" ? null : v })}>
              <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Inativos" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Atividade: todos</SelectItem>
                <SelectItem value="7">Inativos 7d+</SelectItem>
                <SelectItem value="30">Inativos 30d+</SelectItem>
                <SelectItem value="90">Inativos 90d+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </Card>

        <div className="mt-4 space-y-2">
          {error ? (
            <Card className="p-4 border-destructive/40 bg-destructive/5 text-sm">
              <p className="font-medium text-destructive">Erro ao carregar usuários</p>
              <p className="mt-1 text-xs text-muted-foreground break-words">
                {(error as any)?.message || String(error)}
              </p>
              {(error as any)?.hint && (
                <p className="mt-1 text-xs text-muted-foreground">Hint: {(error as any).hint}</p>
              )}
              {(error as any)?.code && (
                <p className="mt-1 text-xs text-muted-foreground">Código: {(error as any).code}</p>
              )}
            </Card>
          ) : isLoading ? (
            Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
          ) : data?.rows.length === 0 ? (
            <Card className="p-8 text-center text-sm text-muted-foreground">Nenhum usuário encontrado.</Card>
          ) : (
            data?.rows.map((u) => {
              const days = daysSince(u.last_seen_at);
              return (
                <Card
                  key={u.id}
                  className="cursor-pointer p-3 hover:bg-muted/40 transition-colors border-border/60"
                  onClick={() => navigate(`/admin/usuarios/${u.id}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{u.display_name || "Sem nome"}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email || "—"}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <UserStatusBadge status={u.account_status} />
                      <PlanBadge plan={u.effective_plan} />
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                    <span>Criado: {fmtDateTime(u.created_at)}</span>
                    <span>Último acesso: {u.last_seen_at ? `${days}d` : "nunca"}</span>
                    <span>Tx: {u.transactions_count}</span>
                    <span>Metas: {u.goals_count}</span>
                    {u.companies_count > 0 && <span>Empresas: {u.companies_count}</span>}
                  </div>
                </Card>
              );
            })
          )}
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <p className="text-xs text-muted-foreground">
            {isFetching ? "Atualizando…" : `${total.toLocaleString("pt-BR")} usuários`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 0}
              onClick={() => update({ page: String(Math.max(0, page - 1)) })}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-xs tabular-nums">
              {page + 1} / {totalPages}
            </span>
            <Button
              size="sm"
              variant="outline"
              disabled={page + 1 >= totalPages}
              onClick={() => update({ page: String(page + 1) })}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </AdminShell>
    </AdminRoute>
  );
};

export default AdminUsersPage;
