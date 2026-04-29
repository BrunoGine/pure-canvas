# Remover Ofensiva, Escudos e Missões Diárias

Remover os elementos de gamificação por streak (ofensiva), escudos de proteção e missões diárias da aba Cursos e do Hub do Aluno, sem quebrar mundos, trilha, badges, certificados, "continue de onde parei" nem o perfil interno.

## O que será removido da UI

1. **StatsHeader** (bloco com Nível/XP + Ofensiva 🔥 + Escudos 🛡️)
   - Hoje exibe 3 cards: Nível, Streak (ofensiva) e Proteções (escudos).
   - Será substituído por um cabeçalho enxuto contendo apenas **Nível + barra de XP** (mantém progressão sem gamificação por dias).
   - Aplicado em: `WorldMap.tsx`, `LessonPath.tsx`, `StudentHubPage.tsx`.

2. **DailyMissionsCard** (card de missões diárias com chama verde)
   - Removido do `WorldMap.tsx` (única tela onde aparece).
   - Arquivos `DailyMissionsCard.tsx`, `useDailyMissions.ts` e `lib/dailyMissions.ts` serão deletados.

3. **Chamadas a `tickMission(...)`** em `LessonPlayer.tsx` (3 ocorrências) e `ExamCenter.tsx` (1 ocorrência) — removidas. Sem impacto no progresso real do aluno (XP, badges de conclusão e progresso de aula continuam funcionando normalmente).

## O que será mantido

- **XP e Nível**: continuam intactos (barra fica visível no novo cabeçalho enxuto).
- **Badges**: o catálogo em `lib/badges.ts` mantém `streak_7` e `streak_30` para não quebrar registros já concedidos a usuários existentes, mas eles deixam de ser exibidos como destaque ativo (continuam apenas como histórico no grid de badges, se o usuário já tiver). Não serão mais concedidos novos.
- **Mentor**: `useMentorAdvice.ts` continua lendo `streak` do banco apenas para personalizar a mensagem inicial ("comece sua ofensiva"). Será ajustado para uma mensagem neutra de incentivo, sem mencionar ofensiva.
- **Banco de dados**: colunas `streak`, `streak_protection` em `user_stats` permanecem (para não exigir migração destrutiva). Apenas deixam de ser exibidas/usadas na UI.
- **Mundos, trilha, certificados, continue studying, perfil do aluno, exames, revisões espaçadas**: nada muda.

## Arquivos afetados

**Editar**
- `src/components/courses/StatsHeader.tsx` — remover blocos de Streak e Escudos; manter só Nível + XP.
- `src/components/courses/WorldMap.tsx` — remover import e render de `DailyMissionsCard`.
- `src/components/courses/LessonPlayer.tsx` — remover import e chamadas a `tickMission`.
- `src/components/courses/ExamCenter.tsx` — remover `useDailyMissions` e chamada a `tick`.
- `src/hooks/useMentorAdvice.ts` — substituir mensagem "Sua ofensiva está zerada..." por incentivo neutro.

**Deletar**
- `src/components/courses/DailyMissionsCard.tsx`
- `src/hooks/useDailyMissions.ts`
- `src/lib/dailyMissions.ts`

## Resultado visual

Antes (topo do `/cursos`): Nível • 🔥 Ofensiva • 🛡️ Escudos → Card de Missões Diárias → Mundos.

Depois: Nível + barra de XP (cabeçalho compacto) → Mundos. Interface mais limpa, sem mecânicas de pressão diária.
