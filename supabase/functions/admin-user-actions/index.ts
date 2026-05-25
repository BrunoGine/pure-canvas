import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Body {
  action: "revoke_sessions" | "hard_delete";
  user_id: string;
  reason?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);
    const callerId = claims.claims.sub as string;

    // Check admin role using user-scoped client (passes through RLS using has_role)
    const { data: roleRow } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = (await req.json()) as Body;
    if (!body?.action || !body?.user_id) return json({ error: "Invalid body" }, 400);
    if (body.user_id === callerId) return json({ error: "Cannot act on self" }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE);

    if (body.action === "revoke_sessions") {
      const { error } = await admin.auth.admin.signOut(body.user_id, "global");
      if (error) return json({ error: error.message }, 500);
      await userClient.rpc("admin_log_action", {
        _action: "revoke_sessions",
        _target_user_id: body.user_id,
        _metadata: { reason: body.reason ?? null },
      });
      return json({ ok: true });
    }

    if (body.action === "hard_delete") {
      // audit first via user-scoped RPC so admin_id = caller
      await userClient.rpc("admin_log_action", {
        _action: "hard_delete_user",
        _target_user_id: body.user_id,
        _metadata: { reason: body.reason ?? null },
      });
      const { error } = await admin.auth.admin.deleteUser(body.user_id);
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
