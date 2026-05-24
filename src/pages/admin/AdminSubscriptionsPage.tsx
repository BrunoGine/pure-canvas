import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Search, Crown, Gift, X, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { PLAN_LABELS, type PlanKey } from "@/lib/plans";

interface UserRow {
  id: string;
  display_name: string | null;
  email: string | null;
}

interface OverrideRow {
  id: string;
  user_id: string;
  plan_type: "premium" | "enterprise";
  starts_at: string;
  expires_at: string | null;
  reason: string;
  active: boolean;
  granted_by: string;
  revoked_at: string | null;
  created_at: string;
}

const DURATION_OPTIONS = [
  { label: "7 dias", value: "7" },
  { label: "30 dias", value: "30" },
  { label: "60 dias", value: "60" },
  { label: "90 dias", value: "90" },
  { label: "1 ano", value: "365" },
  { label: "Vitalício", value: "0" },
];

const REASON_PRESETS = [
  "Beta tester",
  "Influenciador",
  "Compensação",
  "Parceiro",
  "Promoção",
  "Outro",
];

const fmtDate = (s: string | null) =>
  s ? new Date(s).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" }) : "—";

const AdminSubscriptionsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserRow[]>([]);
  const [selected, setSelected] = useState<UserRow | null>(null);

  const [overrides, setOverrides] = useState<OverrideRow[]>([]);
  const [currentPlan, setCurrentPlan] = useState<PlanKey | null>(null);
  const [loadingUser, setLoadingUser] = useState(false);

  const [plan, setPlan] = useState<"premium" | "enterprise">("premium");
  const [duration, setDuration] = useState("30");
  const [reasonPreset, setReasonPreset] = useState("Beta tester");
  const [reasonNote, setReasonNote] = useState("");
  const [granting, setGranting] = useState(false);

  // Debounced search
  useEffect(() => {
    if (!isAdmin) return;
    const t = setTimeout(async () => {
      setSearching(true);
      const { data, error } = await (supabase as any).rpc("admin_search_users", { _query: query });
      setSearching(false);
      if (error) {
        toast({ title: "Erro na busca", description: error.message, variant: "destructive" });
        return;
      }
      setResults((data as UserRow[]) || []);
    }, 300);
    return () => clearTimeout(t);
  }, [query, isAdmin, toast]);

  const loadUser = async (u: UserRow) => {
    setSelected(u);
    setLoadingUser(true);
    const [ovRes, planRes] = await Promise.all([
      (supabase as any)
        .from("subscription_overrides")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false }),
      (supabase as any).rpc("get_effective_plan", { _user_id: u.id }),
    ]);
    setOverrides((ovRes.data as OverrideRow[]) || []);
    setCurrentPlan((planRes.data as PlanKey) || "free");
    setLoadingUser(false);
  };

  const grant = async () => {
    if (!selected) return;
    setGranting(true);
    const days = parseInt(duration, 10);
    const reason = reasonPreset === "Outro" ? reasonNote : `${reasonPreset}${reasonNote ? " — " + reasonNote : ""}`;
    const { error } = await (supabase as any).rpc("admin_grant_override", {
      _user_id: selected.id,
      _plan: plan,
      _duration_days: days === 0 ? null : days,
      _reason: reason,
    });
    setGranting(false);
    if (error) {
      toast({ title: "Erro ao conceder", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Acesso concedido" });
    setReasonNote("");
    loadUser(selected);
  };

  const revoke = async (id: string) => {
    const { error } = await (supabase as any).rpc("admin_revoke_override", { _override_id: id });
    if (error) {
      toast({ title: "Erro ao revogar", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Acesso revogado" });
    if (selected) loadUser(selected);
  };

  if (adminLoading) {
    return <div className="p-6 text-sm text-muted-foreground">Carregando...</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-6 text-center space-y-3">
        <p className="font-medium">Acesso negado</p>
        <p className="text-sm text-muted-foreground">Esta área é restrita a administradores.</p>
        <Button onClick={() => navigate("/")} variant="outline">
          Voltar
        </Button>
      </div>
    );
  }

  const activeOverride = overrides.find((o) => o.active);

  return (
    <div className="space-y-4 pb-24">
      <button
        onClick={() => navigate("/perfil")}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft size={16} /> Voltar
      </button>

      <header className="space-y-1">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Crown size={22} className="text-primary" /> Assinaturas — Admin
        </h1>
        <p className="text-sm text-muted-foreground">
          Conceda Premium ou Empresa manualmente sem afetar o Stripe.
        </p>
      </header>

      {/* Search */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <Label htmlFor="q" className="text-xs uppercase tracking-wider text-muted-foreground">
          Buscar usuário
        </Label>
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="q"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Nome ou email..."
            className="pl-9"
          />
        </div>
        <div className="max-h-64 overflow-y-auto space-y-1">
          {searching && <p className="text-xs text-muted-foreground">Buscando…</p>}
          {!searching && results.length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum resultado.</p>
          )}
          {results.map((u) => (
            <button
              key={u.id}
              onClick={() => loadUser(u)}
              className={`w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition ${
                selected?.id === u.id ? "bg-accent" : ""
              }`}
            >
              <p className="text-sm font-medium">{u.display_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{u.email}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Selected user */}
      {selected && (
        <div className="glass-card rounded-2xl p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{selected.display_name || "Sem nome"}</p>
              <p className="text-xs text-muted-foreground">{selected.email}</p>
              <p className="text-xs text-muted-foreground mt-1">ID: {selected.id.slice(0, 8)}…</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Plano efetivo</p>
              <p className="font-semibold text-primary">
                {loadingUser ? "…" : PLAN_LABELS[currentPlan || "free"]}
              </p>
            </div>
          </div>

          {activeOverride && (
            <div className="rounded-xl border border-primary/30 bg-primary/5 p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm">
                  <Gift size={14} className="text-primary" />
                  <span className="font-medium">
                    Cortesia ativa: {PLAN_LABELS[activeOverride.plan_type]}
                  </span>
                </div>
                <Button size="sm" variant="ghost" onClick={() => revoke(activeOverride.id)}>
                  <X size={14} /> Revogar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Expira: {activeOverride.expires_at ? fmtDate(activeOverride.expires_at) : "Vitalício"} ·{" "}
                {activeOverride.reason || "sem motivo"}
              </p>
            </div>
          )}

          {/* Grant form */}
          <div className="space-y-3 pt-2 border-t border-border">
            <p className="text-sm font-semibold">Conceder novo acesso</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs">Plano</Label>
                <Select value={plan} onValueChange={(v) => setPlan(v as any)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="enterprise">Empresa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Duração</Label>
                <Select value={duration} onValueChange={setDuration}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DURATION_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Motivo</Label>
              <Select value={reasonPreset} onValueChange={setReasonPreset}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {REASON_PRESETS.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Textarea
                placeholder="Observação (opcional)"
                value={reasonNote}
                onChange={(e) => setReasonNote(e.target.value)}
                rows={2}
              />
            </div>
            <Button onClick={grant} disabled={granting} className="w-full">
              {granting ? <Loader2 size={16} className="animate-spin" /> : <Gift size={16} />}
              Conceder acesso
            </Button>
          </div>

          {/* History */}
          {overrides.length > 0 && (
            <div className="space-y-2 pt-3 border-t border-border">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Calendar size={14} /> Histórico
              </p>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {overrides.map((o) => (
                  <div
                    key={o.id}
                    className="text-xs flex items-center justify-between px-3 py-2 rounded-lg bg-muted/40"
                  >
                    <div>
                      <p className="font-medium">
                        {PLAN_LABELS[o.plan_type]} ·{" "}
                        <span className={o.active ? "text-primary" : "text-muted-foreground"}>
                          {o.active ? "ativo" : "inativo"}
                        </span>
                      </p>
                      <p className="text-muted-foreground">
                        {fmtDate(o.starts_at)} → {o.expires_at ? fmtDate(o.expires_at) : "∞"} ·{" "}
                        {o.reason || "—"}
                      </p>
                    </div>
                    {o.active && (
                      <Button size="sm" variant="ghost" onClick={() => revoke(o.id)}>
                        <X size={12} />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminSubscriptionsPage;
