import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";

const PLUGGY_API_URL = "https://api.pluggy.ai";

async function getPluggyAccessToken(): Promise<string> {
  const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
  const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");
  if (!clientId || !clientSecret) throw new Error("Pluggy credentials not configured");

  const res = await fetch(`${PLUGGY_API_URL}/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientId, clientSecret }),
  });
  if (!res.ok) throw new Error(`Pluggy auth failed: ${await res.text()}`);
  const data = await res.json();
  return data.apiKey;
}

async function createConnectToken(accessToken: string): Promise<string> {
  const res = await fetch(`${PLUGGY_API_URL}/connect_token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": accessToken,
    },
    body: JSON.stringify({}),
  });
  if (!res.ok) throw new Error(`Connect token failed: ${await res.text()}`);
  const data = await res.json();
  return data.accessToken;
}

async function fetchAccounts(accessToken: string, itemId: string) {
  const res = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
    headers: { "X-API-KEY": accessToken },
  });
  if (!res.ok) throw new Error(`Fetch accounts failed: ${await res.text()}`);
  return (await res.json()).results;
}

async function fetchTransactions(accessToken: string, accountId: string) {
  const res = await fetch(`${PLUGGY_API_URL}/transactions?accountId=${accountId}&pageSize=500`, {
    headers: { "X-API-KEY": accessToken },
  });
  if (!res.ok) throw new Error(`Fetch transactions failed: ${await res.text()}`);
  return (await res.json()).results;
}

async function fetchItem(accessToken: string, itemId: string) {
  const res = await fetch(`${PLUGGY_API_URL}/items/${itemId}`, {
    headers: { "X-API-KEY": accessToken },
  });
  if (!res.ok) throw new Error(`Fetch item failed: ${await res.text()}`);
  return await res.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { action, itemId } = await req.json();

    if (action === "create_connect_token") {
      const accessToken = await getPluggyAccessToken();
      const connectToken = await createConnectToken(accessToken);
      return new Response(JSON.stringify({ connectToken }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "sync_item") {
      if (!itemId) throw new Error("itemId required");

      const accessToken = await getPluggyAccessToken();
      const item = await fetchItem(accessToken, itemId);

      // Upsert bank_connection
      const { data: connection, error: connError } = await supabase
        .from("bank_connections")
        .upsert({
          user_id: user.id,
          pluggy_item_id: itemId,
          institution_name: item.connector?.name || "Unknown",
          status: item.status,
          updated_at: new Date().toISOString(),
        }, { onConflict: "user_id,pluggy_item_id" })
        .select()
        .single();

      if (connError) throw connError;

      const accounts = await fetchAccounts(accessToken, itemId);
      let allTransactions: any[] = [];

      for (const account of accounts) {
        // Upsert account
        const { data: dbAccount } = await supabase
          .from("bank_accounts")
          .upsert({
            user_id: user.id,
            connection_id: connection.id,
            pluggy_account_id: account.id,
            name: account.name,
            balance: account.balance,
            account_type: account.type,
            currency: account.currencyCode || "BRL",
            updated_at: new Date().toISOString(),
          }, { onConflict: "user_id,pluggy_account_id" })
          .select()
          .single();

        const transactions = await fetchTransactions(accessToken, account.id);

        for (const tx of transactions) {
          allTransactions.push({
            user_id: user.id,
            connection_id: connection.id,
            account_id: dbAccount?.id,
            pluggy_transaction_id: tx.id,
            description: tx.description || tx.descriptionRaw || "Sem descrição",
            amount: Math.abs(tx.amount),
            date: tx.date?.split("T")[0] || new Date().toISOString().split("T")[0],
            category: tx.category || null,
            type: tx.amount >= 0 ? "income" : "expense",
          });
        }
      }

      if (allTransactions.length > 0) {
        // Delete existing transactions for this connection and re-insert
        await supabase.from("bank_transactions")
          .delete()
          .eq("connection_id", connection.id);

        const { error: txError } = await supabase
          .from("bank_transactions")
          .insert(allTransactions);

        if (txError) throw txError;
      }

      return new Response(JSON.stringify({
        connection,
        accountsCount: accounts.length,
        transactionsCount: allTransactions.length,
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
