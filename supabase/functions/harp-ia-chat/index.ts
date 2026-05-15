import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import {
  getDefaultProvider,
  RateLimitError,
  AuthError,
  ProviderError,
  type ChatMessage,
} from "../_shared/ai-provider.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const STYLE_GUIDE = `
## Estilo de resposta (OBRIGATÓRIO)
- Responda em português brasileiro, com tom claro, humano e objetivo.
- Para análises ou perguntas sobre as finanças do usuário, use esta estrutura em Markdown:

## 📊 Resumo
(1-2 frases diretas)

## 💸 Destaques
- itens curtos, com números quando houver

## 📈 Sugestões
- ações práticas e específicas

## ⚠️ Atenção
(opcional, só se houver alerta real)

- Para perguntas curtas (definição, saudação, dúvida pontual), responda em 1-3 parágrafos sem forçar o template.
- Use **negrito** para números e conceitos-chave. Evite parágrafos longos.
- Sempre deixe **uma linha em branco** entre cada seção (antes de cada título ##) e entre parágrafos, para o texto respirar.
- Após cada lista, deixe uma linha em branco antes do próximo tópico.
- NUNCA invente números. Se faltar dado no contexto, diga: "Ainda não tenho essa informação registrada."
- Não repita os dados brutos do contexto — interprete-os.
`;

const PERSONAL_PROMPT = `Você é a Harp.I.A, assistente de finanças pessoais.

Escopo: educação financeira, investimentos, orçamento, dívidas, metas, impostos pessoais, consumo consciente.
Para perguntas claramente fora desse escopo, responda:
"🚫 Sou especializada em finanças pessoais. Posso ajudar com investimentos, orçamento, dívidas, metas e mais. Faça uma pergunta sobre suas finanças! 💰"
${STYLE_GUIDE}`;

const BUSINESS_PROMPT = `Você é a Harp.I.A em modo empresarial: consultora financeira de pequenos negócios.

Escopo adicional: fluxo de caixa, DRE, margem, precificação, capital de giro, fornecedores, tributação simplificada (Simples/MEI), crescimento.
Para perguntas claramente fora de finanças/negócios, responda:
"🚫 Sou consultora financeira da sua empresa. Posso ajudar com fluxo de caixa, margem, despesas, metas e mais."
${STYLE_GUIDE}`;

const MAX_MESSAGES_HISTORY = 8;
const MAX_CONTENT_LENGTH = 4000;
const MAX_CONTEXT_LENGTH = 4000;
const ALLOWED_ROLES = new Set(["user", "assistant"]);

const fmtBRL = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });

function buildContextMessage(ctx: any): string {
  if (!ctx || typeof ctx !== "object") return "";
  const lines: string[] = [];
  const isBiz = ctx.mode === "business";

  lines.push(`## Contexto financeiro do usuário (${isBiz ? "EMPRESA" : "PESSOAL"})`);
  if (isBiz && ctx.company) {
    lines.push(
      `Empresa: **${ctx.company.name}** (${ctx.company.segment ?? "segmento n/d"} · ${ctx.company.business_type ?? "tipo n/d"})`,
    );
  }
  if (!ctx.hasData) {
    lines.push("");
    lines.push("⚠️ O usuário ainda não tem transações/orçamentos/metas registradas.");
    return lines.join("\n");
  }

  const k = ctx.kpis || {};
  lines.push("");
  lines.push("**Mês atual**");
  lines.push(`- Receita: ${fmtBRL(k.revenueMonth)} | Despesa: ${fmtBRL(k.expensesMonth)} | Saldo: ${fmtBRL(k.balanceMonth)}`);
  lines.push(`- Taxa de poupança: ${k.savingsRate}% | Saldo vs mês anterior: ${k.balanceVsPrevPct >= 0 ? "+" : ""}${k.balanceVsPrevPct}%`);
  lines.push(`- Mês anterior → Receita ${fmtBRL(k.revenuePrev)} · Despesa ${fmtBRL(k.expensesPrev)}`);

  if (Array.isArray(ctx.topCategories) && ctx.topCategories.length) {
    lines.push("");
    lines.push("**Top categorias de gasto (mês)**");
    ctx.topCategories.forEach((c: any) => {
      const arrow = c.changePct > 0 ? "↑" : c.changePct < 0 ? "↓" : "→";
      lines.push(`- ${c.category}: ${fmtBRL(c.amount)} (${arrow} ${Math.abs(c.changePct)}% vs mês anterior)`);
    });
  }

  if (Array.isArray(ctx.budgets) && ctx.budgets.length) {
    lines.push("");
    lines.push("**Orçamentos**");
    ctx.budgets.forEach((b: any) =>
      lines.push(`- ${b.category}: ${fmtBRL(b.spent)} / ${fmtBRL(b.limit)} (${b.pct}%)${b.over ? " ⚠️ estourado" : ""}`),
    );
  }

  if (Array.isArray(ctx.goals) && ctx.goals.length) {
    lines.push("");
    lines.push("**Metas**");
    ctx.goals.forEach((g: any) => lines.push(`- ${g.name}: ${fmtBRL(g.current)} / ${fmtBRL(g.target)} (${g.pct}%)`));
  }

  if (Array.isArray(ctx.alerts) && ctx.alerts.length) {
    lines.push("");
    lines.push("**Alertas pré-calculados**");
    ctx.alerts.forEach((a: string) => lines.push(`- ${a}`));
  }

  lines.push("");
  lines.push("> Use APENAS os números acima. Se a pergunta exigir dados ausentes, diga que ainda não tem essa informação.");
  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, lessonContext, context } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    for (const m of messages) {
      if (
        !m ||
        typeof m.role !== "string" ||
        !ALLOWED_ROLES.has(m.role) ||
        typeof m.content !== "string" ||
        m.content.length === 0 ||
        m.content.length > MAX_CONTENT_LENGTH
      ) {
        return new Response(JSON.stringify({ error: "Invalid message format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Janela curta de memória (economia de créditos)
    const recentMessages = messages.slice(-MAX_MESSAGES_HISTORY);

    const isBusiness = context?.mode === "business";
    const systemMessages: { role: string; content: string }[] = [
      { role: "system", content: isBusiness ? BUSINESS_PROMPT : PERSONAL_PROMPT },
    ];

    if (lessonContext && typeof lessonContext === "object") {
      systemMessages.push({
        role: "system",
        content: `O usuário acabou de assistir à aula "${lessonContext.lesson_title ?? ""}". Aprofunde esse tema.`,
      });
    }

    if (context && typeof context === "object") {
      const built = buildContextMessage(context);
      if (built && built.length <= MAX_CONTEXT_LENGTH) {
        systemMessages.push({ role: "system", content: built });
      }
    }

    const apiMessages = [
      ...systemMessages,
      ...recentMessages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    let reply: string;
    let usedModel = "unknown";
    try {
      const provider = getDefaultProvider();
      usedModel = provider.model;
      const result = await provider.generate(apiMessages as ChatMessage[], { temperature: 0.7 });
      reply = result.text;
    } catch (err) {
      console.error("[harp-ia-chat] provider error:", err);
      let status = 500;
      let message = "Estamos com instabilidade temporária. Tente novamente em instantes.";
      if (err instanceof RateLimitError) {
        status = 429;
        message = "Limite de requisições atingido. Tente novamente em instantes.";
      } else if (err instanceof AuthError) {
        status = 500; // não exponha detalhe ao cliente
      } else if (err instanceof ProviderError) {
        status = err.status >= 500 ? 502 : err.status;
      }
      return new Response(JSON.stringify({ error: message }), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Log de uso (best-effort, nunca quebra o chat)
    try {
      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );
      const promptChars = apiMessages.reduce((n, m) => n + (m.content?.length || 0), 0);
      await admin.from("ai_usage_log").insert({
        user_id: userData.user.id,
        feature: "harp_chat",
        model: usedModel,
        prompt_chars: promptChars,
        response_chars: reply.length,
      });
    } catch (e) {
      console.warn("[harp-ia-chat] usage log failed", e);
    }

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
