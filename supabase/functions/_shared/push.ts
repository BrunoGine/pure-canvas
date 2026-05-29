// Shared helper for any edge function to dispatch a push notification.
// Invokes the push-send function with service-role auth.

export type PushCategory =
  | "financial" | "goals" | "courses" | "streak"
  | "harpia" | "business" | "shared_goals" | "security" | "marketing";

export interface SendPushInput {
  user_id: string;
  category: PushCategory;
  title: string;
  body: string;
  dedupe_key?: string;
  cooldown_minutes?: number;
  daily_cap?: number;
  data?: Record<string, unknown>;
}

export async function sendPush(input: SendPushInput) {
  const url = `${Deno.env.get("SUPABASE_URL")}/functions/v1/push-send`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
    },
    body: JSON.stringify(input),
  });
  const text = await res.text();
  if (!res.ok) {
    console.error("[sendPush] failed", res.status, text);
  }
  return { ok: res.ok, status: res.status, body: text };
}
