import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: userData, error: userAuthErr } = await userClient.auth.getUser();
    if (userAuthErr || !userData?.user) {
      console.error("auth.getUser failed", userAuthErr);
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = userData.user.id;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Verify caller is admin
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", callerId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const body = await req.json().catch(() => ({}));
    const { ticketId, messageId, message } = body ?? {};
    if (!ticketId || !messageId) {
      return new Response(JSON.stringify({ error: "ticketId and messageId required" }), { status: 400, headers: corsHeaders });
    }

    const { data: ticket } = await admin
      .from("support_tickets")
      .select("user_id, subject")
      .eq("id", ticketId)
      .single();
    if (!ticket) {
      return new Response(JSON.stringify({ error: "Ticket not found" }), { status: 404, headers: corsHeaders });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("display_name")
      .eq("id", ticket.user_id)
      .maybeSingle();

    const { data: userInfo, error: userErr } = await admin.auth.admin.getUserById(ticket.user_id);
    if (userErr || !userInfo?.user?.email) {
      return new Response(JSON.stringify({ error: "Recipient email not found" }), { status: 404, headers: corsHeaders });
    }

    // send-transactional-email has gateway JWT verification enabled. In the
    // current Supabase signing-keys setup the service role secret may be opaque,
    // so use the anon JWT at the gateway boundary and keep service privileges
    // inside each function via SUPABASE_SERVICE_ROLE_KEY from Deno.env.
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const resp = await fetch(`${supabaseUrl}/functions/v1/send-transactional-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${anonKey}`,
        apikey: anonKey,
      },
      body: JSON.stringify({
        templateName: "ticket-reply",
        recipientEmail: userInfo.user.email,
        idempotencyKey: `ticket-reply-${messageId}`,
        templateData: {
          subject: ticket.subject,
          ticketId,
          userName: profile?.display_name || "Usuário",
          message: message ?? "",
        },
      }),
    });
    if (!resp.ok) {
      const errText = await resp.text();
      console.error("send-transactional-email failed", resp.status, errText);
      return new Response(JSON.stringify({ error: errText }), { status: 502, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-ticket-reply error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
