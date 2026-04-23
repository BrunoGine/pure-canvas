

# Plano — Refinamento UI + Funcionalidades dos Cursos

Foco: visual estilo Duolingo profissional, reassistir/refazer aulas, edição manual completa pelo admin (sem IA) e créditos do vídeo.

## 1. Banco de dados

**Migração** (uma só, aditiva, sem perda de dados):

- `lessons.video_credit text NULL` — texto livre do crédito (ex: "Canal Me Poupe").
- Garantir índice em `lessons(course_id, "order")` para reordenação eficiente.

Nada mais muda no schema. `user_progress` continua intacto — re-fazer aula nunca apaga dados.

## 2. Trilha de aprendizado (`LessonPath.tsx`) — visual Duolingo

Reescrever o layout dos nós:

- Caminho central com nós em zigue-zague usando `translateX` (não `margin-left`) para curva suave.
- Linhas conectoras tracejadas SVG entre nós (cor neutra; verde quando trecho concluído).
- Estados visuais aprimorados:
  - **Concluído**: gradiente verde, ✓ branco, halo verde sutil.
  - **Disponível (atual)**: gradiente do mundo, ▶ branco, anel pulsante (1 animação `pulse` simples — sem `ping` pesado), badge "Atual".
  - **Bloqueado**: cinza chapado, 🔒, opacidade 0.5.
- Cantos arredondados (`rounded-2xl/full`), sombras suaves (`shadow-lg`), tipografia consistente.
- Card lateral por aula com título, subtítulo, XP e badge de status.
- Reduzir animações: usar `transform` apenas, sem `framer-motion` por nó (apenas fade do container).

## 3. Header de stats (`StatsHeader.tsx`)

Reorganizar em 3 blocos horizontais alinhados:

```text
┌──────────────┬───────────────────┬──────────────┐
│  Nv 5        │  🔥 7 dias        │  🛡 🛡 🛡    │
│  ███░░ 230XP │  ofensiva ativa   │  2/3 escudos │
└──────────────┴───────────────────┴──────────────┘
```

- Bloco 1 (Nível): badge grande, barra XP horizontal abaixo, "X XP até nv N+1".
- Bloco 2 (Streak): chama-laranja com fundo quente sutil (`bg-orange-500/10`), número grande, label.
- Bloco 3 (Proteções): renderizar 3 escudos (preenchidos para disponíveis, vazios/opacos para usados).
- Responsivo: em telas estreitas (< 480px), empilha verticalmente.

## 4. Reassistir / Refazer aula (`LessonPlayer.tsx`)

Quando `progress.completed === true`, ao entrar na aula:

- Não pular automaticamente para `step 3`. Mostrar **tela de revisão** com:
  - Status "✓ Concluída — score X%"
  - Botão **"Reassistir vídeo"** → vai para step 0 em **modo revisão** (`reviewMode = true`).
  - Botão **"Refazer exercícios"** → vai direto para step 2 em modo revisão.
  - Botão "Voltar à trilha".
- Em **modo revisão**:
  - Não chama `upsert` de `video_watched`/`summary_read` (já estão `true`).
  - Ao concluir o quiz: atualiza `score` apenas se for melhor que o anterior (`Math.max`).
  - XP reduzido para evitar farm: **+5 XP fixo** ao reassistir vídeo (1x/dia por aula via flag em `localStorage`); **+10 XP** ao refazer quiz com aprovação (sem bônus completo).
  - Não chama `updateStreak` em modo revisão (streak já contou no primeiro complete).
- Toast claro: "Modo revisão — XP reduzido".

## 5. Créditos do vídeo

- Em `LessonPlayer.tsx` step 0: abaixo do `<iframe>`, se `lesson.video_credit` existir, renderizar:
  ```text
  Créditos: <video_credit>
  ```
  Texto pequeno (`text-xs text-muted-foreground`), com ícone `Youtube` ou `User` à esquerda.
- Se vazio/null: não renderizar nada.

## 6. Painel Admin (`AdminPanel.tsx`) — edição completa

Reformular para gestão CRUD sem IA:

### Aba "Mundos"
- Lista de mundos existentes com botão editar/excluir.
- Form criar/editar (modal/inline): título, descrição, nível, ordem, cor, ícone.

### Aba "Aulas"
- Seletor de mundo → lista de aulas desse mundo ordenadas por `order`.
- Cada aula: card com botões ↑ ↓ (reordenar), Editar, Excluir.
- Reordenação por **botões ↑/↓** (simples, sem nova dependência) que fazem swap do campo `order` entre duas aulas via update batch.
- Form editar aula (modal) com **todos** os campos:
  - Título, subtítulo, nível
  - URL do YouTube (re-extrai `youtube_video_id`)
  - **Crédito do vídeo** (`video_credit`, opcional)
  - Ordem (numérica), XP reward
  - **Resumo** — `<textarea>` grande, edita `lessons.summary` diretamente (sobrescreve cache IA)
  - **Perguntas** — editor estruturado: lista de perguntas com tipo (múltipla escolha / aberta), enunciado, opções, índice correto, keywords. Salva em `lessons.questions` (jsonb).
  - Botão "Gerar com IA" (opcional, único uso) ao lado de Resumo/Perguntas — chama `generate-lesson-content` para preencher os campos, mas o admin ainda precisa clicar "Salvar".
- **Não apaga progresso de usuários** — apenas faz `update` na linha de `lessons`.

### Permissão de edição
- Adicionar política RLS em `lessons`: admins podem `UPDATE/DELETE` (já contemplada pela policy "Admins can manage lessons" — verificar e manter).

## 7. Otimizações e estabilidade

- Todas as edições do admin são `update` direto (sem IA).
- IA (`generate-lesson-content`) continua opcional e cacheada — nunca chamada automaticamente em edição.
- React Query: invalidar `["course_lessons", courseId]` e `["lesson", lessonId]` após edits do admin.
- Reordenação: update otimista local antes de persistir.
- Garantir que `useLessonProgress` nunca dispara `delete` — apenas `upsert` aditivo.

## 8. Resumo técnico

- **Migração**: 1 ALTER TABLE (`lessons add column video_credit text`) + index.
- **Componentes alterados**: `LessonPath.tsx`, `StatsHeader.tsx`, `LessonPlayer.tsx`, `AdminPanel.tsx` (reescrita parcial maior).
- **Componentes novos**: `admin/LessonEditor.tsx` (modal de edição), `admin/QuestionsEditor.tsx`, `admin/CourseEditor.tsx`, `courses/ReviewMode.tsx` (tela de revisão).
- **Hooks novos**: `useAdminMutations.ts` (create/update/delete/reorder de cursos e aulas com invalidações).
- **Sem novas dependências**: drag-and-drop substituído por botões ↑/↓.
- **Nenhuma mudança em** `user_progress`, `user_stats`, edge functions ou auth — progresso dos usuários preservado integralmente.

