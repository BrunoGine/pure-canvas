# Hub do Aluno em /cursos

Reorganização da aba Cursos: a Home dos mundos passa a ter um mini-hub com atalhos, Mentor IA, "Continue de onde parei" e um Perfil do Aluno exclusivo. Pop-up de celebração com certificado ao concluir um mundo. Reaproveita 100% das tabelas e lógica já existentes (`user_stats`, `user_progress`, `user_badges`, `certificates`, `lessons`, `courses`).

## O que muda na Home dos Cursos (`WorldMap.tsx`)

Ordem visual nova, acima dos mundos:

```text
┌─────────────────────────────────────────┐
│ Trilha               [Meu Progresso →] │  ← botão no topo
├─────────────────────────────────────────┤
│ StatsHeader (Nível • XP • Streak)       │  (já existe)
├─────────────────────────────────────────┤
│ ▶ Continue de onde parei                │  ← card destaque
│   Mundo X · Aula Y · 60% concluído      │
├─────────────────────────────────────────┤
│ 🧠 Mentor IA                            │  ← card destaque
│   Dica local: "Revise a aula Z"         │
│   [Pedir conselho ao mentor]            │
├─────────────────────────────────────────┤
│ [Progresso] [Certificados] [Treino]     │  ← linha de atalhos
├─────────────────────────────────────────┤
│ Mundos (cards atuais, sem mudança)      │
└─────────────────────────────────────────┘
```

Botão "Meu Progresso" no canto superior direito do header (ao lado do ícone admin) leva a `/cursos/progresso`.

## Perfil do Aluno (rota nova: `/cursos/progresso`)

Página exclusiva da área de cursos, **separada de `/perfil`**. Renderizada via `CoursesPage.tsx`.

Estrutura:
- Header com avatar (do `profiles`), nome, nível e XP
- `StatsHeader` reaproveitado (Nível, XP, Streak, Proteções)
- Grid de Badges desbloqueadas (lê `user_badges`)
- Lista de Certificados conquistados (lê `certificates` + `courses` para o título)
- Estatísticas: total de aulas concluídas, mundos concluídos, % geral

Sem dependência da aba `/perfil`. O perfil global continua exatamente como está.

## Continue de onde parei

Lógica em um hook `useContinueLesson`:
1. Busca em `user_progress` do usuário a linha mais recente (`updated_at desc`) que **não esteja completed**.
2. Se nada incompleto, busca a próxima aula bloqueada após a última completada.
3. Resolve a aula + curso e expõe `{ lesson, course, progressPct }`.

Card clica → `navigate('/cursos/aula/{lessonId}')`. Se o usuário não tem nenhum progresso ainda, o card mostra CTA "Comece pelo primeiro mundo".

## Mentor IA reposicionado

Sai do perfil global (já não está lá hoje) e vira card fixo na Home dos Cursos.

Modo híbrido (sem novas chamadas de IA por padrão):
- **Regras locais** geram a dica padrão a partir de `user_stats` + `user_progress`:
  - streak == 0 → "Comece sua ofensiva hoje com 1 aula curta"
  - última `score < 70` → "Revise a aula X antes de avançar"
  - mundo perto do fim (≥80%) → "Falta pouco para seu certificado!"
  - default → "Bom ritmo! Que tal um treino rápido?"
- Botão **Pedir conselho ao mentor** → abre dialog e chama o edge function existente `harp-ia-chat` com um prompt curto contextualizado (única chamada de IA, sob demanda).

## Pop-up de certificado ao concluir mundo

Em `LessonPlayer.tsx`, no fluxo `finishQuiz` quando `passed === true`:
1. Após salvar progresso, verificar se essa era a última aula não-concluída do mundo (usando `useCourseLessons` em cache).
2. Se sim:
   - `INSERT` em `certificates` (`user_id`, `course_id`) — idempotente: checa antes via `select` se já existe para esse `(user_id, course_id)`.
   - Concede badge `world_complete` em `user_badges` (idempotente, ignora duplicate).
   - Abre `WorldCompleteDialog` com:
     - 🎉 "Parabéns! Você concluiu {nome do mundo}"
     - Preview do certificado (HTML renderizado)
     - Botão **Ver certificado** → `/cursos/certificado/{certificateId}`
     - Botão **Baixar PDF** → gera PDF client-side com `jsPDF` + `html2canvas` (libs já instaladas no `package.json`)

Página `/cursos/certificado/:id` mostra o certificado em tela cheia, com botões de download e voltar.

## Atalhos rápidos (mini-hub)

Linha de 3 botões grandes, estilo Duolingo mas sem copiar:
- **Meu Progresso** → `/cursos/progresso`
- **Certificados** → `/cursos/progresso?tab=certificados` (mesma página, ancora aba)
- **Treino** → reusa "Refazer exercícios" via navegação para a primeira aula com `?mode=treino` (modo revisão já existente em `LessonPlayer`)

Tudo dentro de `/cursos`, nada toca `/perfil`.

## UX visual

- Cards com gradient sutil já no padrão do app (`glass-card`, `gradient-primary`)
- Mentor IA com ícone Brain e cor diferente dos mundos (azul-violeta) para destaque
- "Continue de onde parei" com cor do mundo atual (lê `course.color`) e barra de progresso
- Botões grandes, ícones lucide, tipografia `font-display` nos títulos
- Pop-up com confete (animação framer-motion simples, sem libs novas)

## Arquivos

**Novos:**
- `src/pages/StudentHubPage.tsx` — perfil do aluno (`/cursos/progresso`)
- `src/pages/CertificatePage.tsx` — visualização de 1 certificado
- `src/components/courses/ContinueCard.tsx`
- `src/components/courses/MentorCard.tsx`
- `src/components/courses/QuickActions.tsx`
- `src/components/courses/WorldCompleteDialog.tsx`
- `src/components/courses/CertificateView.tsx` — HTML do certificado (reusado no dialog e na page)
- `src/components/courses/BadgesGrid.tsx`
- `src/components/courses/CertificatesList.tsx`
- `src/hooks/useContinueLesson.ts`
- `src/hooks/useBadges.ts`
- `src/hooks/useCertificates.ts`
- `src/hooks/useMentorAdvice.ts` (regras locais)
- `src/lib/badges.ts` (catálogo: `world_complete`, `streak_7`, `first_lesson`, etc.)

**Editados:**
- `src/components/courses/WorldMap.tsx` — adicionar header com botão "Meu Progresso", `ContinueCard`, `MentorCard`, `QuickActions`
- `src/components/courses/LessonPlayer.tsx` — disparar `WorldCompleteDialog` na última aula
- `src/pages/CoursesPage.tsx` — adicionar rotas `/cursos/progresso` e `/cursos/certificado/:id`

**Não modificados:**
- `src/pages/ProfilePage.tsx` (perfil global intocado)
- Schema do Supabase (todas as tabelas necessárias já existem)
- Edge function `harp-ia-chat` (só consumida pelo botão sob demanda)

## Sem retrabalho

- Reusa `useUserStats`, `useCourseLessons`, `useLessonProgress`, `StatsHeader`, `useCourses`
- Tabelas `certificates` e `user_badges` já existem com RLS
- `jsPDF` e `html2canvas` já no `package.json`
- Nenhuma migração nova, nenhum secret novo

Aprove para implementar.
