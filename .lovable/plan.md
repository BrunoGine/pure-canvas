## Objetivo

Adicionar um aviso visual no editor de aulas (admin) informando que vídeos do YouTube com restrição de idade (+18) não funcionam embedados, orientando o admin a usar uma versão alternativa sem restrição.

## Mudança

Arquivo único: **`src/components/courses/admin/LessonEditor.tsx`**

- Logo abaixo do campo "URL do YouTube" (aba "Informações"), adicionar um bloco informativo discreto:
  - Ícone de alerta (`Info` do lucide-react)
  - Texto: *"Vídeos com restrição de idade (+18) do YouTube não tocam embedados. Use uma versão alternativa do conteúdo, sem restrição, para garantir a reprodução na aula."*
  - Estilo: card pequeno com `bg-amber-500/10`, borda `border-amber-500/30`, texto `text-amber-700 dark:text-amber-300`, padding compacto e tipografia `text-xs`.
- Aviso é puramente estático (sem chamada de API, sem detecção automática) — zero custo de IA e zero impacto em performance.

## Arquivos afetados

- `src/components/courses/admin/LessonEditor.tsx` (apenas edição visual na aba de informações)

## Não afeta

- Player do aluno (`LessonPlayer.tsx`)
- Schema do banco
- Hooks de mutação
- Nenhuma outra funcionalidade existente
