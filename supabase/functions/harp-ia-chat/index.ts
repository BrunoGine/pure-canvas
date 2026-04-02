import "https://deno.land/x/xhr@0.1.0/mod.ts";

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Messages array is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
