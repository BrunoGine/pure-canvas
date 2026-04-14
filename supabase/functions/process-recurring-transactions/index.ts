import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const today = new Date();
  const dayOfMonth = today.getDate();
  const currentMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  // Get active recurring transactions for today's day
  const { data: recurrings, error: fetchError } = await supabase
    .from("recurring_transactions")
    .select("*")
    .eq("day_of_month", dayOfMonth)
    .eq("active", true);

  if (fetchError) {
    return new Response(JSON.stringify({ error: fetchError.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let created = 0;
  for (const rec of recurrings || []) {
    // Skip if already executed this month
    if (rec.last_executed_at) {
      const lastExec = rec.last_executed_at.substring(0, 7); // YYYY-MM
      if (lastExec === currentMonth) continue;
    }

    const { error: insertError } = await supabase
      .from("manual_transactions")
      .insert({
        user_id: rec.user_id,
        description: `[Recorrente] ${rec.description}`,
        amount: rec.amount,
        type: rec.type,
        category: rec.category,
        date: today.toISOString().split("T")[0],
        notes: rec.notes,
      });

    if (!insertError) {
      await supabase
        .from("recurring_transactions")
        .update({ last_executed_at: today.toISOString().split("T")[0] })
        .eq("id", rec.id);
      created++;
    }
  }

  return new Response(JSON.stringify({ processed: created }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
