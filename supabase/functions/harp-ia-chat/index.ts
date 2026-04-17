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
Para QUALQUER pergunta que NÃO esteja relacionada aos temas acima, você DEVE responder EXATAMENTE com:

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
const ALLOWED_ROLES = new Set(["user", "assistant"]);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authentication
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
    const { data: claimsData, error: authError } = await supabase.auth.getClaims(token);
    if (authError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Input validation
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

    const apiMessages = [
      { role: "system", content: SYSTEM_PROMPT },
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
