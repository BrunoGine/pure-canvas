// Edge function: start a 30-day Premium trial for the authenticated user.
// One-time per user. No payment method required.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve user from JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userErr,
    } = await userClient.auth.getUser();
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Ensure subscription row exists
    const { data: existing } = await admin
      .from("subscriptions")
      .select("id, plan, status, trial_started_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing?.trial_started_at) {
      return new Response(
        JSON.stringify({ error: "Trial already used" }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const now = new Date();
    const trialEnds = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    const payload = {
      plan: "premium" as const,
      status: "trialing" as const,
      trial_started_at: now.toISOString(),
      trial_ends_at: trialEnds.toISOString(),
      current_period_end: trialEnds.toISOString(),
      gateway: "none" as const,
    };

    if (existing) {
      const { error } = await admin
        .from("subscriptions")
        .update(payload)
        .eq("user_id", user.id);
      if (error) throw error;
    } else {
      const { error } = await admin
        .from("subscriptions")
        .insert({ user_id: user.id, ...payload });
      if (error) throw error;
    }

    return new Response(
      JSON.stringify({ ok: true, trial_ends_at: trialEnds.toISOString() }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (e) {
    console.error("start-trial error", e);
    return new Response(
      JSON.stringify({ error: (e as Error).message ?? "Internal error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
