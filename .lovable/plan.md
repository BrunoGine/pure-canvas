## Migração da Harp.IA para Gemini Flash via Google AI Studio

### Contexto atual
A `harp-ia-chat` (e também `suggest-goal-amount`, `generate-lesson-content`) usa hoje o **Lovable AI Gateway** (`https://ai.gateway.lovable.dev`) com `LOVABLE_API_KEY`, modelo `google/gemini-2.5-flash`. Funciona, mas está acoplado ao gateway.

A migração troca a camada de transporte para chamar a **Gemini API oficial do Google AI Studio** diretamente, mantendo toda a lógica de prompts, contexto e otimização que já existe.

---

### 1. Secret necessário
Adicionar `GEMINI_API_KEY` (Google AI Studio) via tool de secrets. Sem essa chave a migração não roda — vou solicitar logo no início da implementação.

A `LOVABLE_API_KEY` permanece no projeto (outras funções continuam usando-a por enquanto, e ela vira candidata natural a fallback futuro).

---

### 2. Camada desacoplada de provider (novo)
Criar `supabase/functions/_shared/ai-provider.ts` com:

- Tipo `ChatMessage = { role: "system" | "user" | "assistant"; content: string }`
- Tipo `AIProvider` com método `generate(messages, opts) → Promise<{ text: string }>`
- Implementação `geminiProvider(apiKey, model)` que:
  - Converte `messages` no formato Gemini (`contents` + `systemInstruction`, juntando todas as mensagens `system` numa só `systemInstruction`, e mapeando `assistant → model`)
  - Faz `POST` para `https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key=…`
  - Suporta `generationConfig` (temperature, maxOutputTokens)
  - Retorna texto extraído de `candidates[0].content.parts[].text`
  - Mapeia erros: 429 → `RateLimitError`, 401/403 → `AuthError`, demais → `ProviderError`
- Função `getDefaultProvider()` que devolve o Gemini Flash atual; estrutura pronta para no futuro retornar outro provider ou um chain de fallback (sem implementar agora, conforme item 11 do briefing).

Modelo padrão: `gemini-2.5-flash` (Google AI Studio aceita esse identificador). Configurável por env `HARP_MODEL` para facilitar troca futura sem deploy de código.

---

### 3. Refatorar `supabase/functions/harp-ia-chat/index.ts`
Mantém:
- Toda autenticação atual (JWT + `supabase.auth.getUser`)
- `PERSONAL_PROMPT`, `BUSINESS_PROMPT`, `STYLE_GUIDE`
- `buildContextMessage`, limites `MAX_MESSAGES_HISTORY`, `MAX_CONTENT_LENGTH`, `MAX_CONTEXT_LENGTH`
- Validação de mensagens
- Resposta no formato `{ reply }` (compatibilidade total com `ChatPage`, `MentorCard`, `NewTicketDialog`)

Troca apenas:
- Bloco do `fetch` para `ai.gateway.lovable.dev` → chamada `provider.generate(apiMessages, { temperature: 0.7 })`
- Tratamento de erro padronizado pelo provider, devolvendo as mesmas mensagens em PT-BR (429 → "Limite de requisições atingido…", auth/erro genérico → "Estamos com instabilidade temporária. Tente novamente em instantes.")

---

### 4. Tracking de uso (preparar, não bloquear)
Migration nova:

```sql
create table public.ai_usage_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  feature text not null,           -- 'harp_chat' | 'mentor' | 'support_triage' | ...
  model text not null,
  prompt_chars int,
  response_chars int,
  created_at timestamptz default now()
);
create index on public.ai_usage_log (user_id, created_at desc);
alter table public.ai_usage_log enable row level security;

-- usuário lê o próprio histórico
create policy "users read own usage" on public.ai_usage_log
  for select using (auth.uid() = user_id);
-- só edge function (service role) escreve
create policy "service writes" on public.ai_usage_log
  for insert with check (true);  -- service role bypassa; sem policy pública de insert via anon
```

Na edge function, após resposta de sucesso, gravar 1 linha (best-effort, dentro de `try/catch` que nunca quebra o chat). Deixa pronto para futuros limites por plano (não bloquear ainda — apenas persistir).

---

### 5. Outras edge functions
`suggest-goal-amount` e `generate-lesson-content` **continuam no Lovable Gateway por ora** (fora do escopo do pedido — o briefing fala explicitamente de Harp.IA). Após validar a Harp em Gemini direto, dá para migrar essas em uma próxima rodada usando o mesmo `_shared/ai-provider.ts`. Vou registrar isso como nota.

---

### 6. Frontend
**Sem mudanças.** `ChatPage`, `MentorCard`, `NewTicketDialog` continuam invocando `supabase.functions.invoke("harp-ia-chat", …)` e lendo `data.reply`. UX, markdown, espaçamento e contextos pessoal/empresarial preservados.

Pequena melhora opcional (incluída): em `ChatPage`, mensagem de erro amigável padronizada quando o invoke falhar ("Estamos com instabilidade temporária.") — só se hoje ainda não estiver assim.

---

### Detalhes técnicos relevantes

**Mapeamento de mensagens para Gemini:**
```
[{role:"system",...}, {role:"system",...}, {role:"user",...}, {role:"assistant",...}, {role:"user",...}]
↓
{
  systemInstruction: { parts: [{ text: "<concat de todos os system com \n\n>" }] },
  contents: [
    { role: "user", parts: [{ text: "..." }] },
    { role: "model", parts: [{ text: "..." }] },
    { role: "user", parts: [{ text: "..." }] }
  ]
}
```

**Endpoint:**
`POST https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=GEMINI_API_KEY`

**Segurança:** chave só no Edge Function via `Deno.env.get("GEMINI_API_KEY")`. Nunca exposta ao cliente, nunca em `VITE_*`.

---

### Arquivos
- **Criar:** `supabase/functions/_shared/ai-provider.ts`
- **Editar:** `supabase/functions/harp-ia-chat/index.ts`
- **Migration:** nova tabela `ai_usage_log` + RLS
- **Secret:** `GEMINI_API_KEY` (solicitado ao usuário)

### Critérios de sucesso
- Chat da Harp continua respondendo (pessoal e empresarial)
- Mentor IA e triagem do suporte continuam funcionando
- Markdown renderiza igual
- Erros mostram mensagem amigável sem quebrar UI
- Linhas em `ai_usage_log` aparecem após cada resposta de sucesso
- Nenhuma referência a `LOVABLE_API_KEY` dentro de `harp-ia-chat`