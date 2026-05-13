# Minha Empresa — Fase 3

Foco: dar à Harp.IA visão completa do negócio quando o usuário está em modo empresa, e expor uma trilha de cursos voltada a gestão empresarial. Sem nova edge function — o `harp-ia-chat` atual passa a aceitar contexto empresarial.

## 1. Harp.IA empresarial (reuso do `harp-ia-chat`)

### Backend (`supabase/functions/harp-ia-chat/index.ts`)
- Aceitar novo payload opcional `businessContext` no body, ao lado de `messages` e `lessonContext`:
  ```ts
  businessContext?: {
    company: { name, segment, business_type, monthly_revenue, employees_count, main_goal };
    kpis: { revenueMonth, expensesMonth, profitMonth, revenue6m, expenses6m };
    cashFlow: { balance, lastTransactions: Array<{date, description, amount, type, category}> };
    balanceSheet: { assets, liabilities, equity };
    goals: Array<{name, target, current, deadline}>;
    budgets: Array<{category, limit, spent}>;
  }
  ```
- Validação: limites de tamanho (máx ~3KB serializado, máx 10 transações, máx 10 metas/orçamentos) para não estourar contexto.
- Quando `businessContext` está presente:
  - Anexar bloco de **system message adicional** com:
    - Identidade ampliada: "Você também atua como consultora financeira da empresa **{nome}** ({segmento})."
    - Liberação de escopo: além de finanças pessoais, pode falar de **gestão empresarial, fluxo de caixa, precificação, margem, capital de giro, DRE básico, gestão de fornecedores e tributação simplificada (Simples Nacional, MEI)**.
    - Resumo executivo serializado em Markdown compacto (faturamento, despesas, lucro, top 5 categorias de gasto, metas em andamento, orçamentos estourados).
  - **Não** alterar o bloqueio de escopo pessoal — apenas estende a lista permitida.
- Modelo: manter `google/gemini-2.5-flash` (suficiente para esse contexto).

### Frontend
- `src/hooks/useBusinessContext.ts` (novo): monta o objeto `businessContext` a partir dos hooks já existentes (`useTransactions`, `useGoals`, `useBudgets`, `useCompany`, `lib/balanceSheet`). Memoizado.
- `src/pages/ChatPage.tsx`: quando `mode === "business"`, envia `businessContext` no `invoke` do edge function. Exibe badge no topo do chat: "Modo empresa: {nome da empresa}" com ícone `Building2`.
- Mensagem inicial (placeholder) muda em modo empresa: "Pergunte sobre fluxo de caixa, margem, precificação, fornecedores...".
- Sugestões rápidas (chips) específicas: "Como melhorar minha margem?", "Estou no azul este mês?", "Devo aumentar o estoque?", "Quanto guardar de capital de giro?".

### Privacidade
- Os dados da empresa só são serializados client-side e enviados na requisição autenticada do próprio dono (RLS já garante isolamento).
- Nunca persistir o `businessContext` no banco — é stateless por requisição.

## 2. Cursos empresariais

### Schema
Adicionar coluna `audience` em `courses`:
```sql
alter table public.courses
  add column audience text not null default 'personal'
  check (audience in ('personal', 'business'));
```
- Seed inicial: criar 1 curso empresarial "Gestão Financeira para Pequenos Negócios" com 3 aulas placeholder (admin pode editar depois). Ou apenas marcar `audience='business'` e deixar o admin popular via painel.

### Frontend
- `src/hooks/useCourses.ts`: aceitar `audience` opcional; quando `mode === "business"`, filtrar por `audience='business'`, senão `audience='personal'`.
- `src/components/courses/WorldMap.tsx`: header muda para "Trilha empresarial" quando em modo empresa; estado vazio com CTA "Ainda não há cursos empresariais — volte em breve" caso lista vazia.
- `src/components/courses/admin/CourseEditor.tsx`: novo campo select **Audience** (Pessoal/Empresa) ao criar/editar curso.
- `WorldCompleteDialog`, badges e XP continuam compartilhados (mesma conta).

### Sem mudança em
- `lessons`, `user_progress`, `certificates`, `badges` — todos seguem por curso, então a separação por `audience` já isola tudo.

## 3. Roteamento e UI

- Sem novas rotas. `/cursos` continua único, mas o conteúdo varia conforme `mode`.
- `/chat` idem — mesmo componente, comportamento condicional.

## 4. Fora do escopo

- Múltiplas empresas / colaboradores
- Estoque
- CNPJ / NF-e / fiscal
- Mapeamento contábil manual
- Persistência de histórico de chat empresarial separado

---

## Detalhes técnicos

### Arquivos novos
```text
src/hooks/useBusinessContext.ts
```

### Arquivos atualizados
```text
supabase/functions/harp-ia-chat/index.ts   → aceita businessContext + system prompt estendido
src/pages/ChatPage.tsx                      → envia contexto + UI condicional
src/hooks/useCourses.ts                     → filtro por audience
src/components/courses/WorldMap.tsx         → copy condicional
src/components/courses/admin/CourseEditor.tsx → campo audience
```

### Migração
```sql
alter table public.courses
  add column audience text not null default 'personal';
alter table public.courses
  add constraint courses_audience_check check (audience in ('personal','business'));
create index idx_courses_audience on public.courses(audience);
```

### Limites de payload (Harp empresarial)
- Última 10 transações empresariais (data, descrição, valor, tipo, categoria)
- Top 5 categorias por gasto no mês
- Até 10 metas + 10 orçamentos
- Total serializado < 3KB → cabe folgado no contexto do gemini-2.5-flash
