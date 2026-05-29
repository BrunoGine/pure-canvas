// Hourly cron tick — dispatches:
//   - budget threshold (80%+ current-month spend per category) once/day per user+category
//   - weekly summary (Sundays at user's local 19h)
//   - streak risk (daily at user's local 19h if streak >=3 and no activity today)
// All gated by can_send_notification so spam/quiet hours/caps are enforced.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendPush } from "../_shared/push.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function localHour(tz: string): number {
  try {
    return Number(new Intl.DateTimeFormat("en-US", { hour: "numeric", hour12: false, timeZone: tz }).format(new Date()));
  } catch { return new Date().getUTCHours(); }
}
function localWeekday(tz: string): number {
  try {
    const s = new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: tz }).format(new Date());
    return ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].indexOf(s);
  } catch { return new Date().getUTCDay(); }
}

async function runBudgetThreshold(userId: string) {
  const { data: budgets } = await supabase.from("budgets").select("category, limit_amount").eq("user_id", userId);
  if (!budgets?.length) return;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0,10);
  const { data: txs } = await supabase.from("manual_transactions")
    .select("amount, category, type")
    .eq("user_id", userId).eq("type", "expense").gte("date", monthStart);
  const spentByCat = new Map<string, number>();
  (txs ?? []).forEach((t: any) => spentByCat.set(t.category, (spentByCat.get(t.category) ?? 0) + Number(t.amount || 0)));

  for (const b of budgets as any[]) {
    const spent = spentByCat.get(b.category) ?? 0;
    const pct = b.limit_amount > 0 ? (spent / Number(b.limit_amount)) * 100 : 0;
    if (pct >= 80) {
      const milestone = pct >= 100 ? "100" : "80";
      await sendPush({
        user_id: userId, category: "financial",
        dedupe_key: `budget_${b.category}_${milestone}_${monthStart}`,
        cooldown_minutes: 60 * 24,
        title: pct >= 100 ? `Orçamento estourado: ${b.category} 🚨` : `Orçamento ${b.category} em ${Math.round(pct)}% 👀`,
        body: pct >= 100
          ? `Você ultrapassou o limite de ${b.category} este mês.`
          : `Você já usou ${Math.round(pct)}% do limite de ${b.category}.`,
        data: { url: "/planilhas", category_name: b.category },
      });
    }
  }
}

async function runWeeklySummary(userId: string) {
  const since = new Date(Date.now() - 7*86400_000).toISOString().slice(0,10);
  const { data: txs } = await supabase.from("manual_transactions")
    .select("amount, type").eq("user_id", userId).gte("date", since);
  let income = 0, expense = 0;
  (txs ?? []).forEach((t: any) => { if (t.type === "income") income += Number(t.amount||0); else expense += Number(t.amount||0); });
  await sendPush({
    user_id: userId, category: "financial",
    dedupe_key: `weekly_${new Date().toISOString().slice(0,10)}`,
    cooldown_minutes: 60 * 24 * 6,
    title: "Seu resumo da semana chegou 📊",
    body: `Receitas R$ ${income.toFixed(0)} · Despesas R$ ${expense.toFixed(0)}`,
    data: { url: "/planilhas" },
  });
}

async function runStreakRisk(userId: string) {
  const { data: stats } = await supabase.from("user_stats")
    .select("streak, last_activity_date").eq("user_id", userId).maybeSingle();
  if (!stats || (stats as any).streak < 3) return;
  const today = new Date().toISOString().slice(0,10);
  if ((stats as any).last_activity_date === today) return;
  await sendPush({
    user_id: userId, category: "streak",
    dedupe_key: `streak_risk_${today}`,
    cooldown_minutes: 60 * 20,
    title: `Sua ofensiva de ${(stats as any).streak} dias está em risco 🔥`,
    body: "Estude 1 lição hoje pra manter sua sequência.",
    data: { url: "/cursos" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const { data: prefs } = await supabase
    .from("notification_preferences")
    .select("user_id, timezone, master_enabled");
  if (!prefs?.length) {
    return new Response(JSON.stringify({ ok: true, users: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }

  let processed = 0;
  for (const p of prefs as any[]) {
    if (!p.master_enabled) continue;
    const hour = localHour(p.timezone);
    const weekday = localWeekday(p.timezone);
    try {
      // Budget check at user's 12h (lunch)
      if (hour === 12) await runBudgetThreshold(p.user_id);
      // Weekly summary Sundays 19h
      if (weekday === 0 && hour === 19) await runWeeklySummary(p.user_id);
      // Streak risk daily 20h
      if (hour === 20) await runStreakRisk(p.user_id);
      processed++;
    } catch (e) {
      console.error("[notify-cron-tick] user", p.user_id, e);
    }
  }

  return new Response(JSON.stringify({ ok: true, processed }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
