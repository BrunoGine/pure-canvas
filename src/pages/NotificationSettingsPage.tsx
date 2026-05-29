import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft, Bell, BellOff, Wallet, Target, BookOpen, Flame,
  Sparkles, Building2, Users, Shield, Megaphone, Send, Trash2, Smartphone, Clock,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { useNotificationPreferences, type NotificationPrefKey } from "@/hooks/useNotificationPreferences";
import { usePushSubscription } from "@/hooks/usePushSubscription";

const CATEGORIES: Array<{ key: NotificationPrefKey; icon: any; title: string; desc: string }> = [
  { key: "financial", icon: Wallet, title: "Financeiro", desc: "Orçamentos, gastos incomuns, resumo semanal" },
  { key: "goals", icon: Target, title: "Metas", desc: "Progresso, incentivos e conclusão" },
  { key: "shared_goals", icon: Users, title: "Vaquinhas", desc: "Contribuições, novos membros e meta atingida" },
  { key: "courses", icon: BookOpen, title: "Cursos", desc: "Continue de onde parou e novos níveis" },
  { key: "streak", icon: Flame, title: "Ofensiva", desc: "Lembretes para não perder sua sequência" },
  { key: "harpia", icon: Sparkles, title: "Harp.IA", desc: "Insights e recomendações inteligentes" },
  { key: "business", icon: Building2, title: "Empresa", desc: "Faturamento, fluxo de caixa e pendências" },
  { key: "security", icon: Shield, title: "Segurança", desc: "Novos logins e alterações na conta (sempre enviado)" },
  { key: "marketing", icon: Megaphone, title: "Novidades", desc: "Dicas e novidades do produto" },
];

const fmt = (h: number) => String(h).padStart(2, "0") + ":00";

const NotificationSettingsPage = () => {
  const navigate = useNavigate();
  const { prefs, update, isLoading } = useNotificationPreferences();
  const { supported, permission, isSubscribed, busy, devices, subscribe, unsubscribe, removeDevice, sendTest } =
    usePushSubscription();

  const isIosSafari = /iphone|ipad|ipod/i.test(navigator.userAgent) && !/CriOS|FxiOS/i.test(navigator.userAgent);
  const isStandalone = typeof window !== "undefined" && window.matchMedia?.("(display-mode: standalone)").matches;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-xl hover:bg-secondary">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-bold">Notificações</h1>
      </header>

      <div className="px-4 py-6 space-y-5 max-w-2xl mx-auto">
        {/* Permission card */}
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-card rounded-2xl p-5">
          <div className="flex items-start gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSubscribed ? "gradient-primary text-white shadow-glow" : "bg-secondary text-muted-foreground"}`}>
              {isSubscribed ? <Bell size={22} /> : <BellOff size={22} />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold">
                {isSubscribed ? "Notificações ativas" : "Notificações desativadas"}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {!supported && "Este dispositivo não suporta notificações push."}
                {supported && permission === "denied" && "Permissão bloqueada. Habilite nas configurações do navegador."}
                {supported && permission !== "denied" && !isSubscribed && "Ative para receber lembretes importantes."}
                {supported && isSubscribed && "Você está recebendo notificações neste dispositivo."}
              </p>
            </div>
          </div>

          {isIosSafari && !isStandalone && (
            <div className="mt-4 text-xs bg-accent/10 border border-accent/30 rounded-xl p-3 text-muted-foreground">
              No iPhone, notificações exigem instalar o app: toque em <b>Compartilhar</b> → <b>Adicionar à Tela de Início</b>.
            </div>
          )}

          {supported && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!isSubscribed ? (
                <button
                  onClick={subscribe}
                  disabled={busy || permission === "denied"}
                  className="flex-1 min-w-[140px] py-2.5 rounded-xl gradient-primary text-white text-sm font-semibold shadow-glow disabled:opacity-50"
                >
                  Ativar notificações
                </button>
              ) : (
                <>
                  <button
                    onClick={sendTest}
                    disabled={busy}
                    className="flex items-center justify-center gap-2 flex-1 min-w-[140px] py-2.5 rounded-xl bg-secondary text-sm font-medium hover:bg-secondary/70 disabled:opacity-50"
                  >
                    <Send size={14} /> Enviar teste
                  </button>
                  <button
                    onClick={unsubscribe}
                    disabled={busy}
                    className="py-2.5 px-4 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                  >
                    Desativar aqui
                  </button>
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Master toggle */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">Receber todas as notificações</p>
              <p className="text-xs text-muted-foreground mt-0.5">Desativa tudo (exceto alertas de segurança)</p>
            </div>
            <Switch
              checked={prefs.master_enabled}
              disabled={isLoading}
              onCheckedChange={(v) => update({ master_enabled: v })}
            />
          </div>
        </div>

        {/* Categories */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {CATEGORIES.map(({ key, icon: Icon, title, desc }, i) => {
            const disabled = key !== "security" && !prefs.master_enabled;
            return (
              <div
                key={key}
                className={`flex items-start gap-3 p-4 ${i !== CATEGORIES.length - 1 ? "border-b border-border/50" : ""} ${disabled ? "opacity-50" : ""}`}
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <Switch
                  checked={!!prefs[key]}
                  disabled={isLoading || disabled || key === "security"}
                  onCheckedChange={(v) => update({ [key]: v } as any)}
                />
              </div>
            );
          })}
        </div>

        {/* Quiet hours */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock size={16} className="text-primary" />
            <p className="font-semibold text-sm">Horário silencioso</p>
          </div>
          <p className="text-xs text-muted-foreground mb-4">Nada será enviado entre {fmt(prefs.quiet_hours_start)} e {fmt(prefs.quiet_hours_end)} (exceto segurança).</p>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-xs text-muted-foreground">Início</span>
              <select
                value={prefs.quiet_hours_start}
                onChange={(e) => update({ quiet_hours_start: Number(e.target.value) })}
                className="mt-1 w-full bg-secondary rounded-xl px-3 py-2 text-sm"
              >
                {Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{fmt(h)}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="text-xs text-muted-foreground">Fim</span>
              <select
                value={prefs.quiet_hours_end}
                onChange={(e) => update({ quiet_hours_end: Number(e.target.value) })}
                className="mt-1 w-full bg-secondary rounded-xl px-3 py-2 text-sm"
              >
                {Array.from({ length: 24 }).map((_, h) => <option key={h} value={h}>{fmt(h)}</option>)}
              </select>
            </label>
          </div>
        </div>

        {/* Devices */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <Smartphone size={16} className="text-primary" />
            <p className="font-semibold text-sm">Dispositivos registrados</p>
          </div>
          {devices.length === 0 ? (
            <p className="text-xs text-muted-foreground">Nenhum dispositivo ainda.</p>
          ) : (
            <ul className="divide-y divide-border/50 -mx-2">
              {devices.map((d) => (
                <li key={d.id} className="flex items-center gap-3 px-2 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{d.user_agent?.slice(0, 60) || "Dispositivo"}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {d.platform.toUpperCase()} · Adicionado em {new Date(d.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <button
                    onClick={() => removeDevice(d.token)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded-xl"
                    aria-label="Remover"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
