

# Plano — Trilha de Aprendizado Gamificada (Cursos)

Reformulação completa da aba **Cursos** transformando-a numa trilha tipo Duolingo, com mundos, aulas sequenciais, XP, ofensiva, IA com cache e painel admin.

## 1. Banco de dados (Supabase)

### Novas tabelas

**`courses`** (Mundos)
- `id`, `title`, `description`, `level` (`iniciante`|`intermediario`|`avancado`), `order`, `icon`, `color`, `created_at`

**`lessons`** (Aulas)
- `id`, `course_id`, `title`, `subtitle`, `youtube_url`, `youtube_video_id`, `order`, `xp_reward` (default 50), `summary` (cache IA, nullable), `questions` (jsonb cache IA, nullable), `created_at`

**`user_progress`**
- `id`, `user_id`, `lesson_id`, `completed` (bool), `score` (int), `video_watched` (bool), `summary_read` (bool), `questions_passed` (bool), `completed_at`, `created_at`
- UNIQUE(`user_id`, `lesson_id`)

**`user_stats`** (XP, nível, streak)
- `user_id` (PK), `xp` (int default 0), `level` (int default 1), `streak` (int default 0), `streak_protection` (int default 3), `streak_protection_reset_at` (date), `last_activity_date` (date), `updated_at`

**`user_roles`** (segurança — padrão obrigatório)
- enum `app_role`: `admin`, `user`
- tabela com `user_id`, `role`, UNIQUE(`user_id`,`role`)
- função `has_role(_user_id, _role)` SECURITY DEFINER
- política para admins gerenciarem cursos/aulas

### RLS
- Todos com RLS ativo. `user_progress` e `user_stats` apenas próprio usuário. `courses`/`lessons` SELECT público para autenticados; INSERT/UPDATE/DELETE só para `has_role(auth.uid(),'admin')`.

### Funções/Triggers
- `award_xp(_user_id, _amount)`: incrementa XP e recalcula nível (`floor(sqrt(xp/100)) + 1`).
- `update_streak(_user_id)`: ao registrar atividade, compara `last_activity_date` com hoje; se ontem → +1; se >1 dia → consome proteção ou reseta.
- Cron mensal (ou lazy reset no acesso) para repor `streak_protection = 3`.

## 2. Edge Functions

**`generate-lesson-content`** (nova)
- Input: `{ lesson_id }`. Verifica auth.
- Lê `lessons.summary` e `lessons.questions`. Se ambos existem, retorna direto (cache).
- Se faltar, chama Lovable AI (`google/gemini-2.5-flash`) com transcrição/título/url do YouTube para gerar resumo (≤8 linhas) e 5 perguntas (4 múltipla escolha + 1 aberta) em JSON estruturado.
- Salva no banco e retorna. **Nunca regera se já existe.**
- Tratamento de erro: se IA falhar, retorna stub `{ summary: null, questions: [] }` para a UI mostrar "indisponível".

**`harp-ia-chat`** (alteração mínima)
- Aceitar `context` opcional: `{ lesson_id, lesson_title, youtube_url }`. Quando presente, prepender mensagem system com o contexto da aula para "Treinar mais".

## 3. Frontend — nova estrutura

### Rotas (em `src/pages/Index.tsx`)
- `/cursos` → mapa de mundos
- `/cursos/:courseId` → trilha de aulas do mundo
- `/cursos/aula/:lessonId` → fase da aula (vídeo → resumo → perguntas → conclusão)
- `/cursos/admin` → painel admin (só visível para `has_role admin`)

### Componentes novos (`src/components/courses/`)
- **`WorldMap.tsx`** — lista de mundos com progresso (X/Y aulas), header com XP/nível/streak.
- **`StatsHeader.tsx`** — barra fixa: nível, XP até próximo nível, 🔥 streak, escudos de proteção.
- **`LessonPath.tsx`** — caminho vertical em zigue-zague com nós circulares (concluída ✓ verde, atual destacada com pulse, bloqueada cinza com 🔒).
- **`LessonNode.tsx`** — nó individual; clique navega ou mostra toast "Complete a aula anterior".
- **`LessonPlayer.tsx`** — container com 4 etapas (stepper):
  1. **VideoStep**: iframe YouTube lazy (`loading="lazy"`), sem autoplay. Botão "Já assisti" → marca `video_watched`, +XP, libera próxima etapa.
  2. **SummaryStep**: chama `generate-lesson-content` (com loading skeleton). Mostra markdown. Botão "Continuar" → marca `summary_read`, +XP.
  3. **QuestionsStep**: 5 perguntas (radio para múltipla, textarea para aberta). Calcula `score`. Aprovação ≥60% → `questions_passed`, +XP bônus.
  4. **CompletionStep**: animação de confete, total de XP ganho, atualiza streak, botões "Próxima aula" e "Treinar mais com Harp.I.A" (passa `lesson_id`, `title`, `youtube_url` via state da rota).
- **`AdminPanel.tsx`** — formulários para criar/editar mundos e aulas (input título, subtítulo, nível, link YouTube, ordem). Sem IA.

### Hooks novos (`src/hooks/`)
- `useUserStats()` — busca/atualiza XP, nível, streak (react-query).
- `useCourses()` — busca mundos com contagem de aulas concluídas.
- `useCourseLessons(courseId)` — aulas + progresso, calcula qual está desbloqueada.
- `useLessonProgress(lessonId)` — leitura/escrita do progresso da aula.
- `useIsAdmin()` — chama RPC `has_role`.

### Integração com Harp.I.A
- `ChatPage` aceita `location.state.lessonContext` (de "Treinar mais"). Quando presente, abre nova conversa com mensagem inicial automática: *"Vamos aprofundar a aula '{título}'. Pode me explicar os pontos principais?"* e envia `context` ao edge function.

## 4. Otimizações de custo (crítico)

- **Cache IA permanente**: `lessons.summary` e `lessons.questions` nunca são regenerados. Edge function checa antes de chamar IA.
- **Lazy load**: vídeo YouTube só carrega quando o usuário entra na aula. Conteúdo IA só é buscado ao chegar na etapa 2.
- **React Query** com `staleTime: 5min` para mundos/aulas.
- **Sem polling** — atualizações são por mutations + invalidate.

## 5. UX / Estabilidade

- Feedback visual: toast de XP (+50 XP ⚡), modal de level-up, animação 🔥 ao incrementar streak.
- Navegação: Cursos → Mundo → Aula = 2 cliques.
- Erros tratados: vídeo inválido (regex valida youtube_url ao salvar), IA indisponível (fallback "Resumo em breve" + perguntas opcionais), offline (mostra cache).
- Sistema funciona sem IA: aulas com cache continuam acessíveis; novas aulas mostram aviso mas permitem marcar vídeo como assistido.

## 6. Conteúdo inicial (seed)

Inserir via migração:
- 3 mundos (Iniciante, Intermediário, Avançado).
- 5 aulas placeholder por mundo (título + YouTube de educação financeira PT-BR conhecidos), `summary`/`questions` ficam vazios e serão gerados sob demanda no primeiro acesso.

## 7. Resumo técnico

- **Migrações**: 5 novas tabelas + enum + função `has_role` + funções `award_xp`/`update_streak` + RLS + seed.
- **Edge functions**: 1 nova (`generate-lesson-content`) + extensão leve em `harp-ia-chat`.
- **Frontend**: substituir `CoursesPage` por estrutura roteada, ~8 componentes novos, ~5 hooks, integração com `ChatPage`.
- **Sem novas dependências** — usa `react-router-dom`, `framer-motion`, `react-markdown`, recharts já instalados. Para confete, usa um div animado simples com framer-motion (sem libs).
- Admin: precisa promover seu usuário a `admin` manualmente via SQL após a migração (instrução será dada).

