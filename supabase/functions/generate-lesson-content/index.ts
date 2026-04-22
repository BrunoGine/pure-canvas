import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM = `Você é um especialista em educação financeira. Dado o título e link de uma aula em vídeo, gere:
1. Um resumo didático em português brasileiro com no máximo 8 linhas (use markdown leve).
2. Exatamente 5 perguntas (4 de múltipla escolha com 4 opções cada e 1 aberta) sobre o conteúdo do vídeo.

Responda APENAS com JSON válido neste formato:
{
  "summary": "texto markdown",
  "questions": [
    {"type":"multiple_choice","question":"...","options":["a","b","c","d"],"correct_index":0},
    {"type":"multiple_choice","question":"...","options":["a","b","c","d"],"correct_index":1},
    {"type":"multiple_choice","question":"...","options":["a","b","c","d"],"correct_index":2},
    {"type":"multiple_choice","question":"...","options":["a","b","c","d"],"correct_index":3},
    {"type":"open","question":"...","expected_keywords":["palavra1","palavra2"]}
  ]
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { lesson_id } = await req.json();
    if (!lesson_id || typeof lesson_id !== "string") {
      return new Response(JSON.stringify({ error: "lesson_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: lesson, error: lerr } = await admin.from("lessons").select("*").eq("id", lesson_id).maybeSingle();
    if (lerr || !lesson) {
      return new Response(JSON.stringify({ error: "Lesson not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (lesson.summary && lesson.questions) {
      return new Response(JSON.stringify({ summary: lesson.summary, questions: lesson.questions, cached: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userPrompt = `Aula: "${lesson.title}"\nSubtítulo: ${lesson.subtitle ?? ""}\nVídeo: ${lesson.youtube_url}\n\nGere o resumo e as 5 perguntas conforme instruído.`;

    const aiRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${Deno.env.get("LOVABLE_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error:", aiRes.status, t);
      return new Response(JSON.stringify({ summary: null, questions: [], error: "AI unavailable" }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    const raw = aiData.choices?.[0]?.message?.content ?? "{}";
    let parsed: { summary?: string; questions?: unknown[] };
    try { parsed = JSON.parse(raw); } catch { parsed = {}; }

    const summary = typeof parsed.summary === "string" ? parsed.summary : null;
    const questions = Array.isArray(parsed.questions) ? parsed.questions : [];

    if (summary && questions.length > 0) {
      await admin.from("lessons").update({ summary, questions }).eq("id", lesson_id);
    }

    return new Response(JSON.stringify({ summary, questions, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
