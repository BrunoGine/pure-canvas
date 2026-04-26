## Fase 1 — Gamificação + Revisão (sem IA nova)

Foco em economia de créditos: tudo movido por regras locais e dados já salvos. Mentor IA fica para a Fase 2 (apenas o esqueleto híbrido entra agora).

---

### 1. Sistema de Badges / Conquistas

**Banco (migration):**
- Tabela `user_badges`:
  - `id uuid pk`, `user_id uuid`, `badge_key text`, `unlocked_at timestamptz default now()`
  - `unique(user_id, badge_key)`, RLS: usuário só vê/insere os seus.

**Catálogo (constante no código)** em `src/lib/badges.ts`:
- `first_lesson` — Primeira aula concluída
- `streak_7` — 7 dias de ofensiva
- `streak_30` — 30 dias de ofensiva
- `answers_50` — 50 perguntas respondidas
- `first_world` — Primeiro mundo concluído
- `xp_1000` — 1000 XP atingidos

Cada badge: `{ key, name, description, icon, color }`.

**Hook `useBadges`:**
- Busca `user_badges` do usuário.
- Função `checkAndAward()` chamada após eventos relevantes (concluir aula, responder quiz, ganhar XP). Calcula localmente os marcos a partir de `user_stats`, `user_progress` e contagem de respostas (via `localStorage` + tabela). Insere apenas badges novos.
- Toast "🏆 Conquista desbloqueada: …" ao desbloquear.

**Onde plugar:** `LessonPlayer.finishQuiz` (após upsert/awardXp) chama `checkAndAward({ event: "quiz_finished", correct, total })`.

---

### 2. "Continue de onde parei" (HomePage)

- Nova seção no topo da `HomePage`, acima do saldo, só renderiza se houver progresso ativo.
- Hook `useContinueLesson`: busca o registro mais recente em `user_progress` com `completed=false` (ou último `updated_at`). Junta `lessons` + `courses` para mostrar título do curso e da aula.
- Card mostra: ícone do curso, título da aula, % de progresso (vídeo/resumo/quiz), botão "Continuar" → navega para `/cursos/aula/{id}`.
- Se nenhum, oculta seção.

---

### 3. "Pergunte ao Harp sobre essa aula"

Edge function já aceita `lessonContext`. Falta o ponto de entrada na aula.

- Botão flutuante/inline em `LessonPlayer` (visível em todos os steps): "Tenho dúvida — Perguntar ao Harp".
- Ao clicar: `navigate("/chat", { state: { lessonContext: { lesson_id, lesson_title, youtube_url, summary } } })`.
- Ajustar `harp-ia-chat/index.ts` para incluir `summary` (se vier) no contexto do system prompt.
- `ChatPage` já lida com `lessonContext` — só precisa receber `summary` opcional.

---

### 4. Treino para Prova (Simulado)

- Botão "Treino para Prova" no `WorldMap` (header) e em cada `LessonPath`.
- Nova rota `/cursos/treino` (geral) e `/cursos/:courseId/treino` (por mundo).
- Componente `MockExamPlayer`:
  - Coleta perguntas de aulas com `progress.completed=true` (ou `video_watched`).
  - Pondera questões em que o usuário errou mais (lê de `localStorage` `lesson_attempts_*` salvo hoje pelo LessonPlayer).
  - Sorteia 10 perguntas (configurável). **Não chama IA** — usa `lessons.questions` ou cache de `lesson_ai`.
  - Mesmo motor de correção do quiz atual (multiple_choice / open com keywords).
- Tela de resultado: nota %, acertos/erros, **tópicos para revisar** = lista de aulas das quais vieram as questões erradas, com link para reabrir.
- Persiste último simulado em `localStorage` (`mock_exam_history`).

---

### 5. Certificados por mundo concluído

**Banco (migration):**
- Tabela `certificates`:
  - `id uuid pk default gen_random_uuid()`, `user_id uuid`, `course_id uuid`, `issued_at timestamptz default now()`, `code text unique` (id curto p/ mostrar)
  - `unique(user_id, course_id)`, RLS por usuário.

**Geração automática:** ao concluir todas as aulas de um curso (detectado em `LessonPlayer.finishQuiz` quando `nextLesson` é null e curso fica 100%), inserir certificado se não existir + desbloquear badge `first_world` se aplicável.

**UI:**
- Nova rota `/perfil/certificados`.
- Componente `CertificateView` (HTML estilizado: nome do usuário do `profiles.display_name`, nome do curso, data, código).
- Botão "Baixar PDF" usando **jsPDF + html2canvas** (instalar `jspdf` e `html2canvas`).
- Botão "Compartilhar" via `navigator.share` (fallback: copiar link).

---

### 6. Dashboard no Perfil (aba existente)

Em `ProfilePage.tsx` adicionar nova seção "Meu Progresso" antes do menu, com:
- Card de Nível + XP (reutiliza `StatsHeader`).
- Streak + escudos.
- Grid de badges desbloqueados (cinza para os bloqueados, com tooltip).
- Lista de certificados (mini-card por mundo concluído + link p/ ver).
- Card "Mentor" (item 7).

---

### 7. Mentor IA — esqueleto híbrido (Fase 1)

- Hook `useMentorAdvice`: gera **mensagem por regras locais** com base em `user_stats` + `user_progress` + último simulado/quiz:
  - Se `score < 60` na última tentativa: "Você teve dificuldade em *X*. Recomendo revisar essa aula."
  - Se streak ≥ 7: "Você está consistente! Continue assim."
  - Se sem atividade hoje: "Que tal uma aula rápida hoje?"
- Card no Dashboard mostra essa mensagem.
- Botão "Pedir conselho ao mentor" → abre Chat com prompt pré-montado (`lessonContext` ou contexto do desempenho). **Só chama IA quando o usuário clica.**

---

### 8. Otimização (CRÍTICO)

- Simulado: reusa `lessons.questions` em cache → zero chamadas a `generate-lesson-content`.
- Badges/certificados: 100% regras locais.
- "Continue": só lê do banco.
- Mentor: regras locais por padrão, IA só quando o usuário pedir explicitamente.
- Harp da aula: já existe edge function, só adiciona contexto.

---

## Arquivos a criar/editar

**Criar:**
- `src/lib/badges.ts` — catálogo
- `src/hooks/useBadges.ts`
- `src/hooks/useContinueLesson.ts`
- `src/hooks/useCertificates.ts`
- `src/hooks/useMentorAdvice.ts`
- `src/components/courses/MockExamPlayer.tsx`
- `src/components/courses/MockExamLauncher.tsx` (botão)
- `src/components/profile/BadgesGrid.tsx`
- `src/components/profile/CertificatesList.tsx`
- `src/components/profile/MentorCard.tsx`
- `src/components/profile/CertificateView.tsx`
- `src/pages/CertificatePage.tsx` (rota `/perfil/certificados`)

**Editar:**
- `src/pages/HomePage.tsx` — seção "Continue"
- `src/pages/ProfilePage.tsx` — dashboard + badges + certificados + mentor
- `src/components/courses/LessonPlayer.tsx` — botão Harp + checkAndAward + auto-emitir certificado
- `src/components/courses/WorldMap.tsx` — botão "Treino para Prova"
- `src/components/courses/LessonPath.tsx` — botão "Treino" do mundo
- `src/pages/CoursesPage.tsx` — rotas do simulado
- `src/pages/Index.tsx` — rota `/perfil/certificados`
- `supabase/functions/harp-ia-chat/index.ts` — incluir `summary` no contexto

**Migrations:**
- Criar `user_badges` + RLS
- Criar `certificates` + RLS

**Dependências:** `jspdf`, `html2canvas`.

---

## Aviso

Mentor IA fica em modo **regras locais + botão sob demanda**. A camada de "sugestões inteligentes geradas por IA automaticamente" entra na Fase 2, junto com analytics de erros frequentes mais sofisticada.
