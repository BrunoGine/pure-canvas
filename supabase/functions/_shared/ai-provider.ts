// Camada desacoplada de provider de IA.
// Hoje: Gemini Flash via Google AI Studio.
// Futuro: fallback, múltiplos providers, IA premium por plano.

export type ChatRole = "system" | "user" | "assistant";
export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface GenerateOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface GenerateResult {
  text: string;
  model: string;
}

export class ProviderError extends Error {
  constructor(message: string, public status: number = 500) {
    super(message);
  }
}
export class RateLimitError extends ProviderError {
  constructor(msg = "rate_limited") { super(msg, 429); }
}
export class AuthError extends ProviderError {
  constructor(msg = "auth_error") { super(msg, 401); }
}

export interface AIProvider {
  name: string;
  model: string;
  generate(messages: ChatMessage[], opts?: GenerateOptions): Promise<GenerateResult>;
}

// ----- Gemini (Google AI Studio) -----

function toGeminiPayload(messages: ChatMessage[], opts?: GenerateOptions) {
  const systemParts = messages
    .filter((m) => m.role === "system")
    .map((m) => m.content)
    .filter(Boolean);

  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const payload: Record<string, unknown> = { contents };

  if (systemParts.length) {
    payload.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
  }

  payload.generationConfig = {
    temperature: opts?.temperature ?? 0.7,
    maxOutputTokens: opts?.maxOutputTokens ?? 1024,
  };

  return payload;
}

export function geminiProvider(apiKey: string, model = "gemini-2.5-flash"): AIProvider {
  return {
    name: "google-ai-studio",
    model,
    async generate(messages, opts) {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toGeminiPayload(messages, opts)),
      });

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        console.error("[gemini] error", res.status, body.slice(0, 500));
        if (res.status === 429) throw new RateLimitError();
        if (res.status === 401 || res.status === 403) throw new AuthError();
        throw new ProviderError(`gemini_error_${res.status}`, res.status);
      }

      const data = await res.json();
      const text =
        data?.candidates?.[0]?.content?.parts
          ?.map((p: { text?: string }) => p?.text ?? "")
          .join("")
          .trim() ?? "";

      if (!text) {
        const finish = data?.candidates?.[0]?.finishReason;
        throw new ProviderError(`empty_response${finish ? `:${finish}` : ""}`, 502);
      }

      return { text, model };
    },
  };
}

// Provider padrão da Harp.IA. Estrutura pronta para fallback / multi-provider.
export function getDefaultProvider(): AIProvider {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new ProviderError("missing_gemini_api_key", 500);
  const model = Deno.env.get("HARP_MODEL") || "gemini-2.5-flash";
  return geminiProvider(key, model);
}
