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
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await userClient.auth.getClaims(token);
    if (claimsErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const callerId = claims.claims.sub as string;

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

    const { error: invokeErr } = await admin.functions.invoke("send-transactional-email", {
      body: {
        templateName: "ticket-reply",
        recipientEmail: userInfo.user.email,
        idempotencyKey: `ticket-reply-${messageId}`,
        templateData: {
          subject: ticket.subject,
          ticketId,
          userName: profile?.display_name || "Usuário",
          message: message ?? "",
        },
      },
    });
    if (invokeErr) {
      return new Response(JSON.stringify({ error: invokeErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
