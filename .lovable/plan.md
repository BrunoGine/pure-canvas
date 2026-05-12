# Minha Empresa — Fase 2

Foco: tornar o modo empresa um ambiente real de uso diário, com Home própria, troca de contexto sempre acessível e gestão de metas/orçamentos isolada da vida pessoal. Sem IA empresarial e sem múltiplas empresas nesta fase.

## 1. Switcher fixo no topo

- Novo componente `ContextSwitcher` (`src/components/business/ContextSwitcher.tsx`) renderizado no topo do layout principal (dentro de `Index.tsx`, acima do `<main>`), visível em todas as abas autenticadas.
- Visual: pill com ícone (`User` / `Building2`), nome do contexto ("Pessoal" ou nome da empresa) e chevron. Ao clicar abre dropdown:
  - **Pessoal** — chama `exitBusinessMode()`
  - **{Nome da Empresa}** — chama `enterBusinessMode(id)`
  - Separador + **+ Criar / configurar empresa** → navega para `/empresa/onboarding` (ou Perfil se já existir)
- Esconde no onboarding pessoal e nas telas de auth.
- Quando `mode === "business"`, o switcher também serve como atalho para a Home empresarial (`/empresa`).
- Substitui visualmente o `BusinessModeBanner` atual (que vira redundante e será removido).

## 2. Home empresarial dedicada

Nova rota `/empresa` com layout próprio (não engole a Home pessoal).

- `src/pages/business/BusinessIndex.tsx` — layout + `Routes` empresariais, com guard: sem empresa cadastrada → redireciona para `/empresa/onboarding`. Reusa o mesmo `BottomNav` global (Planilhas, Cursos, Início, Harp, Perfil) — Cursos/Harp/Perfil seguem compartilhados; Início e Planilhas passam a renderizar versões empresariais quando `mode === "business"`.
- `src/pages/business/BusinessHomePage.tsx`:
  - **Header**: saudação + nome da empresa + segmento.
  - **KPIs do mês corrente** (cards em grid 2x2 no mobile):
    - Faturamento (Σ income do mês)
    - Despesas (Σ expense do mês)
    - Lucro estimado (Faturamento − Despesas) com cor condicional
    - Ticket médio (Faturamento / nº de vendas) ou nº de transações
  - **Mini-gráfico** de últimos 6 meses (receita vs despesa) usando `recharts` (já no projeto).
  - **Fluxo recente**: lista das 5 últimas transações empresariais reusando estilo do `TransactionTable`.
  - **Atalhos rápidos**: "Nova entrada", "Nova despesa", "Ver Balanço", "Metas".
  - **Visual sóbrio**: usa tokens `--business-primary` (azul petróleo) já previstos; cards com glass mais discreto.
- A Home pessoal em `/` permanece intocada. Quando `mode === "business"`, ao clicar no ícone "Início" do BottomNav, navega para `/empresa` em vez de `/`.

## 3. Metas e Orçamentos empresariais

A infraestrutura já existe (`company_id` em `goals` e `budgets`, hooks já filtram). Nesta fase é apenas **expor a UI** e ajustar copy.

### Metas empresariais
- Reusa `GoalsSection`, `GoalFormDialog`, `GoalCard`.
- Quando `mode === "business"`:
  - Título muda para "Metas da empresa".
  - Presets de meta (`goalPresets.ts`) ganham bloco `business`: "Faturar R$ X no mês", "Reserva de capital de giro", "Investir em equipamento", "Quitar fornecedor". Sem mexer nos pessoais.
  - Metas compartilhadas (`SharedGoalsSection`) ficam ocultas no modo empresa (não fazem sentido aqui).
- Adicionada como seção da `BusinessHomePage` e como aba dentro da página de Planilhas empresarial.

### Orçamentos empresariais
- Reusa `BudgetsTab` e `BudgetFormDialog` na aba Planilhas.
- Lista de categorias do seletor passa a usar `BUSINESS_CATEGORIES` quando `mode === "business"` (já está assim na criação de transações; replicar em `BudgetFormDialog`).
- Nada novo no schema.

## 4. Roteamento e guards

`src/App.tsx`:
```text
/                       → Index (Home pessoal)
/planilhas, /cursos...  → idem (compartilhadas, com filtro por mode)
/empresa                → BusinessIndex
  /empresa/             → BusinessHomePage
  /empresa/onboarding   → BusinessOnboardingPage (já existe)
```
- Guard em `BusinessIndex`: se `companies.length === 0` → redireciona `/empresa/onboarding`.
- BottomNav: quando `mode === "business"`, o item "Início" aponta para `/empresa`; demais permanecem.

## 5. Identidade visual empresarial

- Adicionar tokens em `index.css` (light + dark):
  - `--business-primary`: azul petróleo (~ `200 50% 35%`)
  - `--business-accent`: dourado discreto para destaque de KPI positivo
  - `--business-surface`: superfície de card mais opaca
  - `--gradient-business`: gradient sóbrio para cards de KPI
- Classe utilitária `.business-card` em `index.css` aplicando os tokens.
- Sem alterar o tema pessoal.

## 6. Limpezas

- Remover `BusinessModeBanner` (substituído pelo switcher).
- `BusinessEntryCard` no Perfil continua, mas vira atalho secundário (texto: "Gerenciar empresa").

## 7. Fora do escopo (para Fase 3)

- Harp.IA empresarial
- Cursos empresariais
- Múltiplas empresas / colaboradores
- Estoque, mapeamento contábil manual, CNPJ/integração fiscal

---

## Detalhes técnicos

### Arquivos novos
```text
src/components/business/ContextSwitcher.tsx
src/pages/business/BusinessIndex.tsx
src/pages/business/BusinessHomePage.tsx
```

### Arquivos atualizados
```text
src/App.tsx                         → rota /empresa/*
src/pages/Index.tsx                 → monta <ContextSwitcher /> no topo
src/components/BottomNav.tsx        → "Início" condicional ao mode
src/pages/ProfilePage.tsx           → remove banner, simplifica BusinessEntryCard
src/components/business/BusinessModeBanner.tsx → deletado
src/components/goals/GoalsSection.tsx → copy/preset condicional ao mode
src/components/goals/goalPresets.ts   → adiciona presets business
src/components/spreadsheets/BudgetFormDialog.tsx → categorias por mode
src/index.css                         → tokens business
src/components/spreadsheets/BudgetsTab.tsx (se necessário)
```

### Sem migração de banco
Toda a separação por `company_id` já está implementada na Fase 1. Esta fase é 100% frontend.

### Reuso
Nenhum componente novo de transações, budgets ou goals — tudo aproveita o que já existe, com filtros vindo do `CompanyContext` que já está em produção.
