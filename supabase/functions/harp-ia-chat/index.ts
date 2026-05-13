import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é a Harp.I.A, uma assistente virtual especializada EXCLUSIVAMENTE em educação financeira e economia pessoal.

## Regras de Comportamento

### Escopo Permitido
Você SOMENTE pode responder sobre os seguintes temas:
- Planejamento financeiro pessoal e familiar
- Investimentos (renda fixa, renda variável, fundos, criptomoedas, etc.)
- Controle de gastos e orçamento
- Reserva de emergência
- Dívidas e como sair delas
- Impostos e declaração de imposto de renda
- Aposentadoria e previdência
- Economia doméstica
- Empreendedorismo financeiro
- Conceitos econômicos (inflação, taxa de juros, câmbio, PIB, etc.)
- Produtos financeiros (CDB, LCI, LCA, Tesouro Direto, ações, FIIs, etc.)
- Educação financeira para crianças e jovens
- Crédito, financiamento e consórcios

### Escopo Proibido
Para QUALQUER pergunta que NÃO esteja relacionada aos temas acima (ou aos temas adicionais quando estiver no modo empresa), você DEVE responder EXATAMENTE com:

"🚫 Desculpe, essa pergunta está fora do meu escopo. Sou a Harp.I.A, especializada exclusivamente em **educação financeira e economia pessoal**. Posso te ajudar com temas como investimentos, planejamento financeiro, controle de gastos, dívidas e muito mais! Faça uma pergunta sobre finanças e terei prazer em ajudar. 💰"

### Estilo de Comunicação
- Seja profissional, clara e didática
- Use linguagem acessível, evitando jargões desnecessários
- Quando usar termos técnicos, explique-os brevemente
- Formate suas respostas em Markdown com títulos, listas e destaques
- Use emojis com moderação para tornar a leitura agradável
- Cite fontes ou referências quando relevante
- Sempre incentive o usuário a buscar orientação profissional para decisões importantes
- Responda sempre em português brasileiro

### Formato de Resposta
- Use títulos (##) para organizar a resposta
- Use listas para enumerar passos ou opções
- Use **negrito** para destacar conceitos importantes
- Use tabelas quando comparações forem úteis
- Use citações (>) para dicas e avisos importantes
- Mantenha as respostas concisas mas completas`;

const MAX_MESSAGES = 50;
const MAX_CONTENT_LENGTH = 4000;
const MAX_BUSINESS_CONTEXT_LENGTH = 5000;
const ALLOWED_ROLES = new Set(["user", "assistant"]);

const fmtBRL = (v: number) =>
  Number(v || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

function buildBusinessSystemMessage(ctx: any): string {
  const c = ctx.company || {};
  const k = ctx.kpis || {};
  const cf = ctx.cashFlow || {};
  const bs = ctx.balanceSheet || {};
  const goals = Array.isArray(ctx.goals) ? ctx.goals.slice(0, 10) : [];
  const budgets = Array.isArray(ctx.budgets) ? ctx.budgets.slice(0, 10) : [];
  const txs = Array.isArray(cf.lastTransactions) ? cf.lastTransactions.slice(0, 10) : [];

  const lines: string[] = [];
  lines.push(`## Modo Empresa Ativado`);
  lines.push(
    `Você também atua agora como **consultora financeira da empresa "${c.name ?? "(sem nome)"}"** (segmento: ${c.segment ?? "não informado"}, tipo: ${c.business_type ?? "não informado"}).`,
  );
  lines.push(``);
  lines.push(`### Escopo adicional permitido (somente neste modo)`);
  lines.push(`- Gestão financeira de pequenos negócios e MEI`);
  lines.push(`- Fluxo de caixa, DRE básico, balanço patrimonial`);
  lines.push(`- Precificação, margem de contribuição, ponto de equilíbrio`);
  lines.push(`- Capital de giro e gestão de fornecedores`);
  lines.push(`- Tributação simplificada (Simples Nacional, MEI)`);
  lines.push(`- Estratégias de crescimento e investimento empresarial`);
  lines.push(``);
  lines.push(`### Resumo executivo da empresa`);
  if (c.monthly_revenue) lines.push(`- Faturamento esperado: ${fmtBRL(Number(c.monthly_revenue))}`);
  if (c.employees_count != null) lines.push(`- Funcionários: ${c.employees_count}`);
  if (c.main_goal) lines.push(`- Objetivo principal: ${c.main_goal}`);
  lines.push(``);
  lines.push(`**KPIs do mês corrente**`);
  lines.push(`- Faturamento: ${fmtBRL(k.revenueMonth ?? 0)}`);
  lines.push(`- Despesas: ${fmtBRL(k.expensesMonth ?? 0)}`);
  lines.push(`- Lucro: ${fmtBRL(k.profitMonth ?? 0)}`);
  if (k.revenue6m != null && k.expenses6m != null) {
    lines.push(`- Últimos 6 meses → Receita: ${fmtBRL(k.revenue6m)} | Despesa: ${fmtBRL(k.expenses6m)}`);
  }
  lines.push(``);
  lines.push(`**Balanço (ano atual)**`);
  lines.push(`- Ativo: ${fmtBRL(bs.assets ?? 0)} | Passivo: ${fmtBRL(bs.liabilities ?? 0)} | Patrimônio: ${fmtBRL(bs.equity ?? 0)}`);

  if (goals.length) {
    lines.push(``);
    lines.push(`**Metas em andamento**`);
    goals.forEach((g: any) =>
      lines.push(
        `- ${g.name}: ${fmtBRL(g.current ?? 0)} de ${fmtBRL(g.target ?? 0)}${g.deadline ? ` (até ${g.deadline})` : ""}`,
      ),
    );
  }

  if (budgets.length) {
    lines.push(``);
    lines.push(`**Orçamentos**`);
    budgets.forEach((b: any) => {
      const overBudget = (b.spent ?? 0) > (b.limit ?? 0);
      lines.push(
        `- ${b.category}: ${fmtBRL(b.spent ?? 0)} / ${fmtBRL(b.limit ?? 0)}${overBudget ? " ⚠️ ESTOURADO" : ""}`,
      );
    });
  }

  if (txs.length) {
    lines.push(``);
    lines.push(`**Últimas transações**`);
    txs.forEach((t: any) => {
      const sign = t.type === "income" ? "+" : "-";
      lines.push(`- ${t.date} | ${t.description} | ${sign}${fmtBRL(Math.abs(Number(t.amount)))} | ${t.category}`);
    });
  }

  lines.push(``);
  lines.push(`> Use estes dados ao responder perguntas sobre a empresa. Sugira ações concretas baseadas nos números acima quando relevante.`);

  return lines.join("\n");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages, lessonContext, businessContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (messages.length === 0 || messages.length > MAX_MESSAGES) {
      return new Response(
        JSON.stringify({ error: `Messages count must be between 1 and ${MAX_MESSAGES}` }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
        return new Response(
          JSON.stringify({ error: "Invalid message format or length" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const systemMessages: { role: string; content: string }[] = [
      { role: "system", content: SYSTEM_PROMPT },
    ];

    if (lessonContext && typeof lessonContext === "object") {
      const ctx = `Contexto: o usuário acabou de assistir à aula "${lessonContext.lesson_title ?? ""}" (vídeo: ${lessonContext.youtube_url ?? ""}). Aprofunde o tema e responda dúvidas relacionadas a essa aula.`;
      systemMessages.push({ role: "system", content: ctx });
    }

    if (businessContext && typeof businessContext === "object") {
      try {
        const serialized = JSON.stringify(businessContext);
        if (serialized.length <= MAX_BUSINESS_CONTEXT_LENGTH) {
          systemMessages.push({
            role: "system",
            content: buildBusinessSystemMessage(businessContext),
          });
        } else {
          console.warn("businessContext too large, ignoring", serialized.length);
        }
      } catch (e) {
        console.warn("invalid businessContext", e);
      }
    }

    const apiMessages = [
      ...systemMessages,
      ...messages.map((msg: { role: string; content: string }) => ({
        role: msg.role,
        content: msg.content,
      })),
    ];

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: apiMessages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI API error:", response.status, errorText);
      return new Response(
        JSON.stringify({ error: "Failed to get AI response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content || "Desculpe, não consegui processar sua pergunta. Tente novamente.";

    return new Response(
      JSON.stringify({ reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
