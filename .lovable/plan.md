# Fase 2 — Expansão sobre a base existente

Objetivo: ampliar o ecossistema de aprendizagem (Mentor, Revisão Espaçada, Treino para Prova, Missões Diárias, Certificados premium e polish visual) **sem recriar** o que já existe e **sem novas chamadas de IA recorrentes**. IA só é usada sob demanda no Mentor e no CTA "estudar com o Harp".

Tudo o que é estado leve novo (datas de revisão, missões diárias, histórico de tentativas) fica em `localStorage` por usuário — sem migração de schema, sem custo de banco extra. Conquistas e certificados continuam usando as tabelas `user_badges` e `certificates` já existentes.

---

## 1. Mentor IA híbrido completo

Expandir `useMentorAdvice` (regras locais, sem IA) e `MentorCard` (botão "Pedir conselho" sob demanda).

**Regras locais novas (Camada 1)** em `src/hooks/useMentorAdvice.ts`:
- além de streak/score/curso quase concluído, considerar:
  - **erros frequentes**: ler `localStorage` `lesson_attempts_*` (já populado pelo `LessonPlayer.finishQuiz`) e priorizar a aula com mais tentativas e `lastPassed=false`.
  - **revisões pendentes vencidas** (do módulo 2): se houver, sugerir abrir a fila.
  - **simulado recente ruim**: ler `localStorage` `exam_results` (gravado pelo Treino).
  - **ofensiva ativa alta**: mensagem de celebração / próximo marco.
- A função retorna lista priorizada de até 3 dicas (`MentorAdvice[]`); o card mostra a top-1 e oferece "ver todas" num popover discreto.

**Camada 2 (sob demanda)** em `MentorCard.tsx`:
- Reaproveita o botão atual; ao clicar, monta prompt com **contexto local resumido** (nível, XP, streak, último curso, top-3 erros, % conclusão) e chama `harp-ia-chat` **apenas 1 vez** com `staleTime: Infinity` em cache local (`react-query`) por chave `mentor_ai_advice_<dia>` — evita repetir chamada no mesmo dia.
- Adicionar 3 chips dentro do diálogo: "Plano de estudo", "O que revisar?", "Próxima ação" — cada um envia um prompt curto pré-formatado (ainda 1 chamada por clique do usuário, nunca automática).

Sem novos arquivos de hook — apenas extensão dos já existentes.

---

## 2. Revisão Inteligente (Revisão Espaçada — SM-lite)

Implementação 100% local, sem IA, sem schema novo.

**Novo arquivo `src/lib/spacedReview.ts`**: utilitários puros
- `scheduleReview(lessonId, score)` — agenda próxima revisão em **1d / 3d / 7d / 15d** conforme acertos consecutivos; reseta para 1d se score < 70.
- `getDueReviews()` — retorna `{ lessonId, dueAt, stage, lastScore }[]` com `dueAt <= now`.
- `getUpcomingReviews(days=3)` — para preview no hub.
- Persistência: `localStorage["spaced_reviews_v1"]` = `Record<lessonId, { stage, dueAt, lastScore, attempts }>`.

**Hook `src/hooks/useSpacedReviews.ts`**: lê o localStorage + faz `JOIN` em memória com `lessons`/`courses` via uma única query Supabase pelos `lessonId`s presentes. React Query com `staleTime: 60s`.

**Integrações**:
- `LessonPlayer.finishQuiz`: após `passed`, chama `scheduleReview(lessonId, score)` (próxima janela). Em retry com falha, reseta para 1d.
- `WorldMap`: adicionar bloco **"🔁 Revisões Pendentes"** logo após `ContinueCard` (apenas se houver itens devidos), com até 3 cards mini (título, mundo, "revisar agora"). Clica → `/cursos/aula/<id>?mode=review` (LessonPlayer já tem `reviewMode`; passar via search param e ativar).
- `StudentHubPage > tab "treino"`: adicionar lista completa de revisões pendentes + próximas (preview).

---

## 3. Treino para Prova (evolução do simulado)

A aba "Treino" hoje só redireciona para a aula em `continueData`. Vamos transformá-la em um **mini-simulado real** reutilizando perguntas existentes (`lesson.questions` + cache `aiContent.questions` quando já gerado).

**Novo `src/components/courses/ExamCenter.tsx`** (renderizado dentro da aba `treino` do `StudentHubPage`):
- Seletor de **escopo**: todos os mundos / mundo específico (dropdown a partir de `useCourses`).
- 3 modos:
  - **Treino rápido** — 5 perguntas aleatórias do escopo.
  - **Simulado completo** — 15 perguntas, cronômetro opcional, sem feedback até o fim.
  - **Revisão dos erros** — apenas perguntas que o usuário errou (lê `localStorage["lesson_attempts_*"].lastResults`).
- Pool de perguntas: hook `useQuestionBank(scope)` que carrega `lessons.questions` (campo `jsonb` já existente) **sem chamar IA** (reaproveita conteúdo já salvo). Se uma aula não tem `questions` salvas, é simplesmente excluída do pool — sem nova chamada à edge function.
- Resultado:
  - desempenho geral (%);
  - **desempenho por tópico** (agrupando por `course.title` da aula de origem da pergunta);
  - lista "Aulas a revisar" com link direto (alimenta `scheduleReview` em modo "review priority").
  - Grava `localStorage["exam_results"]` (últimas 10 tentativas) para alimentar o Mentor.
- Reusa `QuestionsStep` extraído de `LessonPlayer.tsx` — vamos **exportá-lo** como componente nomeado em vez de duplicar.

Refactor mínimo no `LessonPlayer.tsx`: extrair `QuestionsStep` e `QuizResultsStep` para `src/components/courses/quiz/QuestionsStep.tsx` e `QuizResultsStep.tsx` (mover, sem alterar lógica).

---

## 4. Mentor + Harp — CTA contextual

Após desempenho fraco em quiz / simulado / revisão (`score < 60` ou 2ª tentativa falhada), exibir CTA inline:

> "Quer estudar isso com o Harp?"

- Em `QuizResultsStep` (após extração) e na tela de resultados do `ExamCenter`.
- Botão navega para `/chat` com state `{ initialPrompt: "Estou com dificuldade em <título da aula / tópico>. Pode me explicar com exemplos práticos?" }`.
- `ChatPage` precisa apenas ler `location.state.initialPrompt` e pré-popular o input (1 chamada IA somente quando o usuário enviar).

---

## 5. Missões Diárias

100% local, reset diário automático.

**Novo `src/lib/dailyMissions.ts`**:
- Catálogo fixo de 4 missões base (3 sorteadas por dia):
  - `watch_lesson` — assistir 1 aula (qualquer)
  - `complete_training` — completar 1 treino rápido
  - `review_one` — revisar 1 aula pendente
  - `quiz_pass` — passar em 1 quiz hoje
- Estado: `localStorage["daily_missions_<YYYY-MM-DD>"] = { picked: [keys], progress: {key:n}, claimed: {key:bool} }`. Limpeza automática de chaves antigas.
- Recompensas:
  - +20 XP por missão (via `awardXp`);
  - se completar todas as 3: badge **`daily_complete`** (idempotente — se já existe, só dá XP bônus +30); proteção de streak +1 (limitada a 1/dia, gravada em localStorage).

**Hook `src/hooks/useDailyMissions.ts`**: leitura/escrita + auto-tracking.

**Componente `src/components/courses/DailyMissionsCard.tsx`**: card no topo do `WorldMap` (entre `StatsHeader` e `ContinueCard`) com 3 missões + barra de progresso e botão "Resgatar" quando completa.

**Hooks de progresso** (sem mudanças de schema):
- `LessonPlayer.handleVideoDone` → `tickMission("watch_lesson")`.
- `LessonPlayer.finishQuiz` (quando `passed`) → `tickMission("quiz_pass")`.
- `ExamCenter` ao completar treino rápido → `tickMission("complete_training")`.
- Ao concluir uma revisão pendente → `tickMission("review_one")`.

Adicionar nova entrada em `BADGES`: `daily_complete` (ícone `Calendar`, cor amarela).

---

## 6. Certificados — versão premium

Sem alterar fluxo nem schema (`certificates` já tem `code`, `issued_at`).

Em `src/components/courses/CertificateView.tsx`:
- Adicionar **selo de validação visual** (círculo com `Award` + selo "Verificado") e linha "Verificação: harpy.app/v/`<code>`".
- Adicionar **assinatura estilizada** (fonte cursiva via Tailwind `font-serif italic`) "Equipe Harpy".
- Adicionar **plano de fundo geométrico sutil** (SVG pattern com a cor do mundo) atrás do conteúdo — melhora "cara premium" sem pesar.
- Adicionar **número sequencial** (4 últimos chars do `id` em maiúsculas) ao lado do `code`.

Em `CertificatePage.tsx`:
- Mostrar **histórico** (lista lateral em desktop / acima em mobile) com todos os certificados emitidos pelo usuário (já temos `useCertificates`).
- Adicionar botão **"Copiar link de validação"** que copia `${origin}/cursos/certificado/<id>`.

Em `CertificatesList.tsx` (StudentHub):
- Mostrar **número total** ("Você tem N certificados") e **ID curto** já formatado.

Sem novas tabelas. Sem novas chamadas de IA.

---

## 7. Polish visual (Fase 2)

Sem reescrever nada — apenas refinar:
- **MentorCard**: trocar gradiente por glass + halo animado sutil, adicionar avatar do mentor (ícone `Brain` num círculo com ring); chips de ação organizados em uma linha.
- **DailyMissionsCard**: três pílulas com ícones e checkmark animado ao concluir.
- **Revisões Pendentes**: cards horizontais com badge de "vencida há Xd" quando atrasada.
- **ExamCenter**: layout em "estádio" (banner com modo + cronômetro), tela de resultado com gráfico de barras por tópico (componente leve em SVG, sem libs novas).
- **StudentHub**: substituir as 3 stats simples por cards com mini-sparkline (XP últimos 7 dias derivado de `user_progress.completed_at` — já existe).
- Garantir tipografia `font-display` consistente em títulos e remover sombras genéricas tipo "shadow-lg" puro em favor das tokens do projeto (`shadow-glow`, `shadow-elevated`).

---

## 8. Restrições críticas (não quebrar)

Não tocar em:
- Estrutura de `courses` / `lessons` / `user_progress` / `user_stats` / `user_roles` / `profiles` (sem migrações nesta fase).
- Lógica de conclusão de mundo + emissão de certificado em `LessonPlayer.finishQuiz` (apenas adicionar chamadas de `scheduleReview` e `tickMission` ao final, sem alterar ramos existentes).
- `ContinueCard`, `BadgesGrid`, `WorldCompleteDialog`, `useCertificates`, `useBadges`, `useContinueLesson` — só estendidos via composição.
- Perfil global (`ProfilePage`) — fica intocado; tudo de aluno continua em `/cursos/progresso`.

---

## 9. Custo de IA / créditos

| Fluxo | IA? | Quando |
|---|---|---|
| Card mentor (regras locais) | Não | Sempre |
| "Pedir conselho ao mentor" | Sim | 1x por clique, cache diário |
| CTA "estudar com o Harp" | Sim | Só quando usuário clicar e enviar mensagem |
| Revisão espaçada | Não | Tudo local |
| Treino para Prova | Não | Reusa `lesson.questions` salvo |
| Missões diárias | Não | Local |
| Certificado premium | Não | Render local |
| Polish visual | Não | CSS |

Resultado esperado: **zero novas chamadas automáticas de IA**, mantendo apenas as 2 entradas sob demanda do usuário.

---

## Detalhamento técnico (resumo)

**Arquivos a criar**
- `src/lib/spacedReview.ts`
- `src/lib/dailyMissions.ts`
- `src/hooks/useSpacedReviews.ts`
- `src/hooks/useDailyMissions.ts`
- `src/hooks/useQuestionBank.ts`
- `src/components/courses/PendingReviewsCard.tsx`
- `src/components/courses/DailyMissionsCard.tsx`
- `src/components/courses/ExamCenter.tsx`
- `src/components/courses/quiz/QuestionsStep.tsx` (extraído)
- `src/components/courses/quiz/QuizResultsStep.tsx` (extraído + CTA Harp)

**Arquivos a editar (cirúrgico)**
- `src/hooks/useMentorAdvice.ts` — novas regras + multi-dica
- `src/components/courses/MentorCard.tsx` — chips, cache diário, polish
- `src/components/courses/WorldMap.tsx` — inserir `DailyMissionsCard` e `PendingReviewsCard`
- `src/pages/StudentHubPage.tsx` — aba Treino passa a renderizar `ExamCenter`; sparkline opcional
- `src/components/courses/LessonPlayer.tsx` — chamar `scheduleReview` + `tickMission`; importar QuestionsStep/QuizResultsStep do novo módulo
- `src/components/courses/CertificateView.tsx` — premium look
- `src/pages/CertificatePage.tsx` — histórico + copiar link
- `src/components/courses/CertificatesList.tsx` — total + ID
- `src/lib/badges.ts` — adicionar `daily_complete`
- `src/pages/ChatPage.tsx` — ler `location.state.initialPrompt`

**Migrações de banco**: nenhuma.
**Novas secrets**: nenhuma.
**Novas edge functions**: nenhuma (reusa `harp-ia-chat`).

---

## O que o usuário verá após aprovar

1. Na tela de Cursos: novo card de **Missões Diárias**, novo bloco **🔁 Revisões Pendentes** (quando houver), Mentor com mais inteligência local e botão de IA com chips.
2. No Hub do Aluno → aba **Treino**: simulado completo, treino rápido e revisão de erros, com desempenho por tópico.
3. Após errar quiz/simulado: CTA **"Estudar com o Harp"** que abre o chat já com a pergunta pronta.
4. Certificados com visual premium, código de validação destacado e histórico.
5. Zero novas chamadas automáticas à IA.
