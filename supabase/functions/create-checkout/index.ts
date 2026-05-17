import { createClient } from "npm:@supabase/supabase-js@2";
import Stripe from "npm:stripe@17";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PLAN_CONFIG: Record<string, { name: string; month: number; year: number }> = {
  premium: { name: "Harp.I.A. Premium", month: 1490, year: 14300 },
  enterprise: { name: "Harp.I.A. Empresa", month: 3490, year: 33500 },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const userId = claimsData.claims.sub as string;
    const email = claimsData.claims.email as string | undefined;

    const body = await req.json().catch(() => ({}));
    const plan = String(body.plan ?? "");
    const interval = String(body.interval ?? "month") as "month" | "year";
    if (!PLAN_CONFIG[plan] || !["month", "year"].includes(interval)) {
      return new Response(JSON.stringify({ error: "Invalid plan or interval" }), { status: 400, headers: corsHeaders });
    }

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-12-18.acacia" });
    const cfg = PLAN_CONFIG[plan];
    const unitAmount = interval === "month" ? cfg.month : cfg.year;
    const lookupKey = `${plan}_${interval}_brl`;

    // Find or create price via lookup_key
    let price = (await stripe.prices.list({ lookup_keys: [lookupKey], active: true, limit: 1 })).data[0];
    if (!price) {
      const products = await stripe.products.search({ query: `metadata['plan']:'${plan}'` });
      const product = products.data[0] ?? (await stripe.products.create({
        name: cfg.name,
        metadata: { plan },
      }));
      price = await stripe.prices.create({
        product: product.id,
        unit_amount: unitAmount,
        currency: "brl",
        recurring: { interval },
        lookup_key: lookupKey,
        metadata: { plan, interval },
      });
    }

    // Reuse Stripe customer if known
    const { data: sub } = await supabase
      .from("subscriptions")
      .select("gateway_customer_id")
      .eq("user_id", userId)
      .maybeSingle();
    let customerId = sub?.gateway_customer_id ?? undefined;
    if (!customerId && email) {
      const found = await stripe.customers.list({ email, limit: 1 });
      customerId = found.data[0]?.id;
    }

    const origin = req.headers.get("origin") ?? "https://app.lovable.app";
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: price.id, quantity: 1 }],
      success_url: `${origin}/planos?success=1&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/planos?canceled=1`,
      allow_promotion_codes: true,
      subscription_data: {
        metadata: { user_id: userId, plan, interval },
      },
      metadata: { user_id: userId, plan, interval },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-checkout error", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
