// Central push dispatcher. Provider-agnostic: today supports web_push via VAPID;
// future providers (fcm/apns/onesignal) plug in by adding more branches.

import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const VAPID_PUBLIC = Deno.env.get("VAPID_PUBLIC_KEY")!;
const VAPID_PRIVATE = Deno.env.get("VAPID_PRIVATE_KEY")!;
const VAPID_SUBJECT = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@example.com";

if (VAPID_PUBLIC && VAPID_PRIVATE) {
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

interface SendInput {
  user_id: string;
  category: string;
  title: string;
  body: string;
  dedupe_key?: string;
  cooldown_minutes?: number;
  daily_cap?: number;
  data?: Record<string, unknown>;
}

async function logSkip(input: SendInput, reason: string) {
  await supabase.from("notification_logs").insert({
    user_id: input.user_id,
    category: input.category,
    dedupe_key: input.dedupe_key ?? null,
    title: input.title,
    body: input.body,
    data: input.data ?? {},
    status: "skipped",
    skip_reason: reason,
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Caller must be service-role (internal). Reject anonymous.
  const auth = req.headers.get("Authorization") || "";
  const expected = `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`;
  if (auth !== expected) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let input: SendInput;
  try { input = await req.json(); } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!input.user_id || !input.category || !input.title || !input.body) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Gate
  const { data: gate, error: gateErr } = await supabase.rpc("can_send_notification", {
    _user_id: input.user_id,
    _category: input.category,
    _dedupe_key: input.dedupe_key ?? null,
    _cooldown_minutes: input.cooldown_minutes ?? 60,
    _daily_cap: input.daily_cap ?? 3,
  });
  if (gateErr) {
    console.error("[push-send] gate error", gateErr);
    return new Response(JSON.stringify({ error: gateErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  const row = Array.isArray(gate) ? gate[0] : gate;
  if (!row?.allowed) {
    await logSkip(input, row?.reason ?? "blocked");
    return new Response(JSON.stringify({ skipped: true, reason: row?.reason }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Fetch devices
  const { data: devices, error: devErr } = await supabase
    .from("notification_devices")
    .select("*")
    .eq("user_id", input.user_id)
    .eq("enabled", true);

  if (devErr) {
    console.error("[push-send] devices error", devErr);
    return new Response(JSON.stringify({ error: devErr.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
  if (!devices || devices.length === 0) {
    await logSkip(input, "no_devices");
    return new Response(JSON.stringify({ skipped: true, reason: "no_devices" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const payload = JSON.stringify({
    title: input.title,
    body: input.body,
    data: input.data ?? {},
    category: input.category,
  });

  const results: Array<{ token: string; ok: boolean; status?: number; error?: string }> = [];
  const toDisable: string[] = [];

  for (const d of devices) {
    try {
      if (d.provider === "web_push") {
        if (!d.p256dh || !d.auth) {
          results.push({ token: d.token, ok: false, error: "missing_keys" });
          continue;
        }
        await webpush.sendNotification(
          { endpoint: d.token, keys: { p256dh: d.p256dh, auth: d.auth } },
          payload,
          { TTL: 60 * 60 * 24 },
        );
        results.push({ token: d.token, ok: true });
      } else {
        // fcm/apns/onesignal — future
        results.push({ token: d.token, ok: false, error: `provider_${d.provider}_not_implemented` });
      }
    } catch (e: any) {
      const status = e?.statusCode;
      results.push({ token: d.token, ok: false, status, error: String(e?.body ?? e?.message ?? e) });
      if (status === 404 || status === 410) toDisable.push(d.token);
    }
  }

  if (toDisable.length > 0) {
    await supabase.from("notification_devices")
      .delete()
      .eq("user_id", input.user_id)
      .in("token", toDisable);
  }

  const sentAny = results.some((r) => r.ok);
  await supabase.from("notification_logs").insert({
    user_id: input.user_id,
    category: input.category,
    dedupe_key: input.dedupe_key ?? null,
    title: input.title,
    body: input.body,
    data: input.data ?? {},
    status: sentAny ? "sent" : "failed",
    skip_reason: sentAny ? null : "all_devices_failed",
    provider_response: { results },
  });

  return new Response(JSON.stringify({ sent: sentAny, results }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
