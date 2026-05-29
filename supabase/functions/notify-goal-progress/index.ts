// Invoke after goal/shared-goal updates. Body: { goal_id?, shared_goal_id?, kind? }
// Computes progress milestone (25/50/75/90/100) and dispatches accordingly.
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { sendPush } from "../_shared/push.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function milestone(pct: number): number | null {
  for (const m of [100, 90, 75, 50, 25]) if (pct >= m) return m;
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization") || "";
  if (!authHeader.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
  const userClient = createClient(
    Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!,
    { global: { headers: { Authorization: authHeader } } },
  );
  const token = authHeader.replace("Bearer ", "");
  const { data: claims } = await userClient.auth.getClaims(token);
  if (!claims?.claims) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }
  const callerId = claims.claims.sub as string;

  const body = await req.json().catch(() => ({}));
  const { goal_id, shared_goal_id } = body as { goal_id?: string; shared_goal_id?: string };

  if (goal_id) {
    const { data: g } = await supabase.from("goals").select("*").eq("id", goal_id).maybeSingle();
    if (!g || (g as any).user_id !== callerId) {
      return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    }
    const goal = g as any;
    if (!goal.target_amount) return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
    const pct = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
    const ms = milestone(pct);
    if (!ms) return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
    await sendPush({
      user_id: goal.user_id, category: "goals",
      dedupe_key: `goal_${goal.id}_${ms}`,
      cooldown_minutes: 60 * 24 * 30,
      title: ms === 100 ? `Meta "${goal.name}" concluída 🎉` : `Você está em ${ms}% da meta "${goal.name}" 🚀`,
      body: ms === 100 ? "Parabéns! Hora de criar a próxima 🥳" : `Faltam R$ ${remaining.toFixed(0)} para concluir.`,
      data: { url: "/", goal_id: goal.id },
    });
    return new Response(JSON.stringify({ ok: true, milestone: ms }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }

  if (shared_goal_id) {
    const { data: sg } = await supabase.from("shared_goals").select("*").eq("id", shared_goal_id).maybeSingle();
    if (!sg) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" }});
    const goal = sg as any;
    const pct = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
    const ms = milestone(pct);
    if (!ms) return new Response(JSON.stringify({ skipped: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});

    const { data: members } = await supabase.from("shared_goal_members")
      .select("user_id").eq("shared_goal_id", shared_goal_id);
    const remaining = Math.max(0, Number(goal.target_amount) - Number(goal.current_amount));
    for (const m of (members ?? []) as any[]) {
      await sendPush({
        user_id: m.user_id, category: "shared_goals",
        dedupe_key: `sgoal_${goal.id}_${ms}`,
        cooldown_minutes: 60 * 24 * 30,
        title: ms === 100 ? `Vaquinha "${goal.name}" completa 🎉` : `Vaquinha "${goal.name}" em ${ms}%`,
        body: ms === 100 ? "Meta atingida — parabéns à equipe!" : `Faltam R$ ${remaining.toFixed(0)} para fechar a vaquinha.`,
        data: { url: "/", shared_goal_id: goal.id },
      });
    }
    return new Response(JSON.stringify({ ok: true, milestone: ms, notified: members?.length ?? 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" }});
  }

  return new Response(JSON.stringify({ error: "goal_id or shared_goal_id required" }), {
    status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
