
# Swipe horizontal nativo (estilo Instagram) entre as abas principais

## Objetivo

Substituir o swipe atual (que só chama `navigate()` no `touchend`) por um **pager horizontal contínuo**, onde as 5 abas principais ficam montadas lado a lado e acompanham o dedo em tempo real, com snapping físico, velocity e resistência elástica nas bordas.

## Escopo

Abas envolvidas (ordem atual mantida):

```
[ /planilhas ] [ /cursos ] [ / (home) ] [ /chat ] [ /perfil ]
```

Sub-rotas (`/cursos/:id`, `/perfil` → `/admin/...`, `/suporte`, `/chat` modal, etc.) **continuam funcionando normalmente** — o pager só governa o gesto quando a URL bate exatamente em uma das 5 abas-raiz. Em qualquer outra rota (admin, detalhe de curso, suporte, onboarding...) o swipe horizontal fica desativado e a navegação se comporta como hoje.

## Arquitetura

### 1. Novo componente `src/components/SwipePager.tsx`

- Container com `overflow: hidden`, `touch-action: pan-y` (libera scroll vertical, captura horizontal).
- Track interno com `display: flex; width: 500%` contendo 5 slots, um por aba.
- Usa **Framer Motion** (já presente no projeto) com `motion.div` + `drag="x"`:
  - `dragConstraints` calculados via ref de largura do container.
  - `dragElastic={0.18}` → resistência elástica nas bordas (primeira/última aba).
  - `dragMomentum={false}` (controlamos o snap manualmente).
  - `style={{ x }}` controlado por `useMotionValue`, com `animate(x, target, { type: "spring", stiffness: 320, damping: 34, mass: 0.9 })` para o snap.
- Detecção de intenção:
  - No `onPointerDown` guardamos `startX/startY`.
  - No primeiro `pointermove` decidimos: se `|dy| > |dx| * 1.2` antes de 8px → cancelamos drag (deixa scroll vertical livre). Caso contrário travamos horizontal.
- `onDragEnd(info)`:
  - threshold = `min(80px, 22% da largura)`.
  - velocity threshold = `500 px/s`.
  - Se `offset > threshold` **ou** `velocity > threshold` → snap pra próxima/anterior; senão volta pra atual.
  - Chama `navigate(SWIPE_ORDER[nextIdx])` **depois** do snap começar (rota é só reflexo — UI já moveu).

### 2. Integração com React Router em `src/pages/Index.tsx`

Problema: hoje cada aba é uma `<Route>` que monta/desmonta. Para o pager manter estado e renderizar lado a lado, as 5 abas-raiz precisam estar **sempre montadas**.

Solução:
- Detectar `isRootTab = SWIPE_ORDER.includes(pathname)`.
- Quando `isRootTab` for true → renderizar `<SwipePager activeIndex={...}>` com as 5 páginas dentro (`HomePage`, `SpreadsheetsPage`, `CoursesPage` apenas índice, `ChatPage`, `ProfilePage`). Cada uma envolvida em `<div style={{ width: '100%', flexShrink: 0 }}>`.
- Quando estiver em sub-rota (admin, `/cursos/:id`, `/suporte`, `/perfil/...`) → renderizar `<Routes>` normal (sem pager), como hoje.
- Sync bidirecional:
  - Mudança de rota (ex.: clique no `BottomNav`) → `useEffect` anima `x` para o novo índice.
  - Drag finalizado → `navigate()` pro novo path.

### 3. Performance / preservação de estado

- Páginas ficam **sempre montadas** dentro do pager → React Query cache, scroll position e estado local preservados.
- Usar `will-change: transform` e `transform: translate3d(...)` (Motion já faz).
- Páginas inativas recebem `pointer-events: none` durante o drag pra evitar clicks fantasma e `aria-hidden`.
- Scroll vertical de cada página continua independente — cada slot tem seu próprio container scrollável.

### 4. Remover swipe antigo

- Apagar `onTouchStart`/`onTouchEnd` e o ref `touch` em `Index.tsx` (substituídos pelo pager).
- Manter `data-no-swipe` como hint visual mas não é mais necessário pra rotas não-tab.

### 5. Edge cases tratados

- `BottomNav` clica numa aba não-adjacente (ex.: planilhas → perfil): pager anima diretamente com spring (sem passar pelas intermediárias visualmente, mas suave).
- Pull-to-refresh / scroll vertical preservado via `touch-action: pan-y` + checagem de intenção.
- Listas horizontais internas (ex.: filtros, carrosséis): elementos com `data-no-swipe` ou `overflow-x: auto` filhos continuam impedindo o pager (checagem de `closest('[data-no-swipe], .overflow-x-auto')` no pointerdown).
- Rota inicial diferente de tab-raiz: pager nem monta, comportamento legado.
- Modo `business` (`/empresa`): hoje não está em `SWIPE_ORDER`. Mantemos fora do pager (continua navegação normal) — ou incluímos? **Pergunta abaixo.**

## Detalhes técnicos

- Stack usada: Framer Motion (`motion`, `useMotionValue`, `animate`, `PanInfo`) — já dependência.
- Sem novas libs.
- Spring config: `stiffness: 320, damping: 34, mass: 0.9` → snap rápido mas com leve overshoot orgânico.
- Elastic factor: `0.18` (sutil, igual iOS).
- Threshold de commit: `max(60px, container.width * 0.22)` + velocity `> 500 px/s`.
- GPU: Motion aplica `transform: translate3d` automaticamente.

## Arquivos afetados

- **Novo**: `src/components/SwipePager.tsx`
- **Editado**: `src/pages/Index.tsx` (remove handlers de touch, adiciona branch root-tab vs sub-rota)
- Nenhuma mudança em páginas individuais, hooks ou backend.

## Fora do escopo

- Não mexer em transições de sub-rotas (admin, detalhes de curso) — continuam navegação normal.
- Não alterar `BottomNav`.
- Sem mudanças visuais nas páginas em si.

---

## Pergunta antes de implementar

A rota `/empresa` (modo business) hoje **não** faz parte da ordem de swipe — ela substitui `/` no `BottomNav` quando `mode === "business"`. Quero confirmar:

→ Quando o usuário está em modo business, o swipe deve usar `/empresa` no lugar de `/` (mesma posição central)? Assumindo que **sim** (faz sentido com o BottomNav), implemento dessa forma.
