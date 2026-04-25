# Plano — Corrigir edição de aulas que não reflete na UI

## Causa raiz
1. `invalidateQueries` não força refetch quando `staleTime` é alto → UI mantém snapshot antigo.
2. `useEffect` em `LessonEditor`/`CourseEditor` depende de `initial` (referência nova a cada render do parent) → form reseta e descarta edições.

## Mudanças

### 1. `src/hooks/useAdminMutations.ts`
- Tornar `invalidateAll` `async` e usar `qc.refetchQueries({ queryKey, type: "all" })` em vez de `invalidateQueries`.
- `await invalidateAll(...)` em todos os `onSuccess` (saveCourse, deleteCourse, saveLesson, deleteLesson, swapLessonOrder) para garantir cache atualizado antes do modal fechar.

### 2. `src/components/courses/admin/LessonEditor.tsx`
- Mudar dependência do `useEffect` de `[initial, open, courseId]` para `[open, initial?.id, courseId]`.
- Form só reinicializa ao abrir o modal ou trocar de aula, nunca durante edição.

### 3. `src/components/courses/admin/CourseEditor.tsx`
- Mesma correção: dependência `[open, initial?.id]` em vez de `[initial, open]`.

### 4. `src/hooks/useCourseLessons.ts`
- `staleTime: 0` (era 60_000) — garante dados frescos ao montar a tela.

## Garantias
- Sem mudanças de schema, RLS, edge functions ou hooks de progresso.
- `user_progress` e `user_stats` intactos.
- Sem novas dependências.
