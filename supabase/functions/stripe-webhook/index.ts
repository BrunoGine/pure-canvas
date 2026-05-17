import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

// Public webhook — no CORS needed, no JWT verification.
// Signature is validated via STRIPE_WEBHOOK_SECRET.

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, {
  apiVersion: "2024-12-18.acacia",
});

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

function planFromMetadata(md: Record<string, string> | undefined | null): "premium" | "enterprise" | null {
  const p = md?.plan;
  if (p === "premium" || p === "enterprise") return p;
  return null;
}

async function syncSubscription(sub: Stripe.Subscription) {
  const userId = sub.metadata?.user_id;
  if (!userId) {
    console.warn("syncSubscription: missing user_id metadata", sub.id);
    return;
  }
  const item = sub.items.data[0];
  const interval = (item?.price?.recurring?.interval ?? "month") as "month" | "year";
  const plan = planFromMetadata(sub.metadata) ?? (item?.price?.metadata?.plan as any) ?? "premium";
  const unitAmount = item?.price?.unit_amount ?? 0;
  const status =
    sub.status === "active" || sub.status === "trialing" ? sub.status :
    sub.status === "past_due" ? "past_due" :
    sub.status === "canceled" ? "canceled" : "expired";

  await admin.from("subscriptions").upsert({
    user_id: userId,
    plan,
    status,
    billing_interval: interval,
    price_cents: unitAmount,
    currency: (item?.price?.currency ?? "brl").toUpperCase(),
    gateway: "stripe",
    gateway_customer_id: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
    gateway_subscription_id: sub.id,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}

Deno.serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const secret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
  const body = await req.text();

  let event: Stripe.Event;
  try {
    if (signature && secret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, secret);
    } else {
      // Fallback for initial setup before webhook secret is configured.
      console.warn("STRIPE_WEBHOOK_SECRET missing — skipping signature verification");
      event = JSON.parse(body) as Stripe.Event;
    }
  } catch (e) {
    console.error("Webhook signature failed", e);
    return new Response(`Webhook Error: ${(e as Error).message}`, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(session.subscription as string);
          // ensure metadata has user_id
          if (!sub.metadata?.user_id && session.metadata?.user_id) {
            await stripe.subscriptions.update(sub.id, {
              metadata: { ...sub.metadata, ...session.metadata },
            });
            sub.metadata = { ...sub.metadata, ...session.metadata };
          }
          await syncSubscription(sub);
        }
        break;
      }
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      case "invoice.payment_failed": {
        const inv = event.data.object as Stripe.Invoice;
        if (inv.subscription) {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
          await syncSubscription(sub);
        }
        break;
      }
      default:
        break;
    }
    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook handler error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500 });
  }
});
