

# Plano — Correção da Trilha + Redesign dos Mundos

## 1. Correção da trilha (`LessonPath.tsx`) — bug de sobreposição

Problema atual: nós com `translateX` e cards laterais saem do alinhamento; o SVG conector (200px de largura, posicionado em `-top-12`) sobrepõe títulos das aulas vizinhas.

**Solução escolhida — Timeline lateral vertical** (máxima legibilidade, zero sobreposição):

- Layout em duas colunas:
  - **Coluna esquerda fixa (56px)**: trilha vertical decorativa com nós circulares.
  - **Coluna direita (flex-1)**: conteúdo da aula (título, subtítulo, XP, badges).
- Linha conectora vertical contínua atrás dos nós (1 elemento absolute com `bg-border`, `w-0.5`, centralizado na coluna esquerda, `z-0`).
- Trecho da linha entre nós concluídos fica verde (segmentos absolutos por par concluído).
- Nós circulares (56px) com `z-10` para ficar acima da linha.
- Conteúdo em card à direita, com gap horizontal mínimo de 16px do nó. **Nunca** sobreposto pela linha.
- Estados visuais mantidos: ✓ verde, ▶ cor do mundo + ring pulsante para "atual", 🔒 cinza opaco.
- Remove `NODE_OFFSETS` e `translateX` (causa raiz da sobreposição).

Layout:
```text
●───── [Aula 1: Título ........... +20 XP]  ✓
│
●───── [Aula 2: Título ........... +20 XP]  Atual
│
○───── [Aula 3: Título (bloqueada)]         🔒
```

## 2. Redesign dos Mundos (`WorldMap.tsx`)

Substituir cards horizontais pequenos por **blocos grandes imersivos**:

- Cada card ocupa **100% da largura**, altura mínima de **160px**, padding `p-6`.
- Estrutura interna:
  - Topo: ícone grande (48px) em badge arredondada + label do nível (Iniciante/Intermediário/Avançado) como pill.
  - Título grande (`text-2xl font-bold`) + subtítulo (`text-sm text-muted-foreground`).
  - Rodapé: barra de progresso espessa (`h-2 rounded-full`) + texto "X de Y aulas • NN%".
- **Background com gradiente diagonal** baseado em `c.color`:
  - `linear-gradient(135deg, {color}22 0%, {color}08 60%, transparent 100%)` (sutil, não exagerado).
  - Borda colorida sutil: `border border-{color}/20`.
  - Elemento decorativo: círculo grande `blur-2xl` da cor do mundo no canto superior direito (com `opacity-20`, `pointer-events-none`).
- Cantos: `rounded-3xl`. Sombra: `shadow-lg hover:shadow-xl`.
- Hover: `hover:-translate-y-0.5 transition` (leve, sem animação pesada).
- Diferenciação: cada mundo já tem `c.color` próprio no banco; o gradiente + borda + glow herdam dessa cor → cada bloco tem identidade visual única mantendo consistência estrutural.

## 3. Responsividade

- Trilha: layout em 2 colunas funciona em qualquer largura (coluna esquerda fixa 56px, conteúdo flexível). Em telas <380px o card lateral usa `text-sm` e quebra em 2 linhas.
- Mundos: largura 100% por padrão; em telas ≥768px (`md:`) mantém 100% (single column intencional para impacto visual).

## 4. Arquivos alterados

- `src/components/courses/LessonPath.tsx` — reescrita do bloco da trilha (header e StatsHeader inalterados).
- `src/components/courses/WorldMap.tsx` — reescrita dos cards de mundo.

Nenhuma mudança em hooks, dados, edge functions ou progresso do usuário.

