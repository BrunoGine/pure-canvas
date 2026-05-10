
# Minha Empresa — Fase 1 (MVP)

Módulo empresarial reusando a infraestrutura existente, com separação lógica via `company_id` e visual diferenciado. Nesta fase entregamos: onboarding, ambiente empresarial navegável, transações empresariais com categorias próprias, Home com KPIs e geração do Balanço Patrimonial em PDF.

## 1. O que entra no MVP

- Botão **🏢 Minha Empresa** no Perfil
- Onboarding empresarial (6 perguntas, 1 por tela, estilo Nubank)
- Switcher persistente no topo (Pessoal ▾ / Minha Empresa) **+** rota dedicada `/empresa/*`
- Home empresarial com KPIs (faturamento, despesas, lucro, fluxo recente)
- Transações empresariais reusando componentes da pessoal, com categorias empresariais padrão
- Aba **Planilhas → Balanço Patrimonial** (seleção de ano + geração de PDF)
- Identidade visual sóbria/corporativa (mesmo design system, paleta mais discreta)

Fora do MVP (estrutura preparada, não implementado): Orçamentos/Metas/Cursos/Harp empresariais, múltiplas empresas, colaboradores, estoque, mapeamento contábil manual.

## 2. Modelo de dados (separação lógica)

Decisão: **`company_id` nullable** nas tabelas existentes. `null` = pessoal, preenchido = empresa. Reusa hooks e componentes, evita duplicação, e já abre caminho para múltiplas empresas no futuro.

Migrações:

- `companies` — `id`, `user_id` (owner), `name`, `business_type`, `segment`, `monthly_revenue`, `employees_count`, `main_goal`, timestamps. RLS: dono lê/edita/deleta o que criou.
- Adicionar coluna `company_id uuid null` em: `manual_transactions`, `recurring_transactions`, `budgets`, `goals`, `credit_cards`. Índice em `(user_id, company_id)`.
- Atualizar policies dessas tabelas para continuar exigindo `auth.uid() = user_id` (a separação por escopo é feita no app via filtro `company_id`).
- Em `profiles`: adicionar `active_company_id uuid null` para lembrar o último contexto usado.

## 3. Contexto e navegação

- `CompanyContext` (`src/contexts/CompanyContext.tsx`): expõe `activeCompany`, `companies`, `setActiveCompany(id|null)`, `mode: "personal" | "business"`. Persiste em `profiles.active_company_id` + `localStorage`.
- Switcher no topo (componente `ContextSwitcher`) visível em todas as páginas autenticadas.
- Rota `/empresa/*` com layout próprio (`BusinessIndex`) e `BottomNav` empresarial; Home pessoal segue em `/`.
- Hooks existentes (`useTransactions`, `useBudgets`, `useGoals`, `useCreditCards`, `useRecurringTransactions`) recebem filtro automático: quando `mode === "business"`, filtram/escrevem com `company_id = activeCompany.id`; caso contrário `company_id is null`.

## 4. Onboarding empresarial

- Rota: `/empresa/onboarding`. Reusa `OnboardingShell` + `StepLayout`.
- Steps: Nome → Tipo → Segmento → Faturamento → Funcionários (opcional) → Objetivo principal.
- Ao concluir: insere em `companies`, define `active_company_id` e navega para `/empresa`.
- Guard: ao entrar em `/empresa/*` sem `companies` para o usuário, redireciona para o onboarding.

## 5. Home empresarial

`src/pages/business/BusinessHomePage.tsx`:
- KPIs do mês: Faturamento (soma `income`), Despesas (soma `expense`), Lucro estimado (income − expense)
- Card de metas empresariais (placeholder vazio nesta fase)
- Lista "Fluxo recente" reusando o componente de transações
- Visual mais sóbrio: cards com `--business-primary` (azul petróleo/grafite), glass mais discreto, ícones `Briefcase`/`Building2`

## 6. Transações empresariais

- Reusa `TransactionTable`, `TransactionEditDialog` etc.
- Novo `src/lib/businessCategories.ts`:
  - Entradas: Vendas, Serviços, Recebimentos
  - Saídas: Fornecedor, Estoque, Impostos, Funcionários, Marketing, Aluguel, Transporte, Outros
- O seletor de categoria troca a lista conforme o `mode`. Categorias personalizadas continuam funcionando.

## 7. Balanço Patrimonial (funcionalidade-chave)

Aba **Planilhas** ganha card "📑 Gerar Balanço Patrimonial" quando em modo empresa.

Fluxo:
1. Usuário escolhe o ano.
2. App agrega no cliente todas as transações do período (deterministicamente, sem IA).
3. Mapeamento automático categoria → grupo contábil (com disclaimer "não substitui contador"):
   - **Ativo Circulante**: saldo positivo de caixa (Σ income − Σ expense quando > 0), Recebimentos pendentes (placeholder 0 nesta fase)
   - **Ativo Não Circulante**: Investimentos (categoria) — 0 se inexistente
   - **Passivo Circulante**: Fornecedor, Impostos, Funcionários, Aluguel (vencidos no período)
   - **Resultado do Exercício**: Receita Bruta, Despesas Totais por grupo, Lucro/Prejuízo
4. Geração do PDF com `jspdf` + `jspdf-autotable` (já viáveis no projeto): capa com nome da empresa, CNPJ opcional, período; seções Ativo, Passivo, DRE simplificada; tipografia limpa, tabelas com totais em destaque, rodapé com disclaimer.
5. Preview HTML antes do download (modal full-screen com o mesmo layout do PDF).

Arquivos:
- `src/lib/balanceSheet.ts` — agregadores puros e tipos.
- `src/lib/balanceSheetPdf.ts` — geração do PDF (espelha padrão de `certificatePdf.ts`).
- `src/components/business/BalanceSheetDialog.tsx` — seletor de ano + preview + botão download.

## 8. Identidade visual do modo empresa

- Tokens novos em `index.css`: `--business-primary`, `--business-accent`, `--business-surface`, `--gradient-business`. Mantém base dark/light.
- Componente `BusinessShell` aplica wrapper com classe `business-mode` para variantes de cards/glass mais sóbrias.
- Ícones: `Building2`, `Briefcase`, `Receipt`, `BarChart3`.

## 9. Harp.IA, Cursos, Metas, Orçamentos empresariais

Não implementados nesta fase, mas:
- Rotas `/empresa/chat`, `/empresa/cursos`, `/empresa/metas`, `/empresa/orcamentos` já existem mostrando estado "Em breve" para deixar o BottomNav coerente.
- `company_id` já presente nas tabelas relacionadas — basta plugar nas próximas fases.

## 10. Segurança e estabilidade

- RLS continua amarrada em `user_id`; `company_id` é filtro de aplicação dentro do escopo do próprio usuário.
- Nenhuma mudança nas telas pessoais além do switcher e do botão no Perfil.
- Sem uso de IA em cálculos/relatórios. IA fica reservada para fases futuras (Harp empresarial).

## Detalhes técnicos (resumo de arquivos)

```text
supabase/migrations/<ts>_minha_empresa.sql
  - create table companies + RLS
  - alter table ... add column company_id (5 tabelas)
  - alter profiles add active_company_id

src/contexts/CompanyContext.tsx           (novo)
src/hooks/useCompanies.ts                 (novo)
src/components/business/ContextSwitcher.tsx
src/components/business/BusinessShell.tsx
src/components/business/BalanceSheetDialog.tsx
src/components/profile/BusinessEntryCard.tsx   (botão no Perfil)

src/pages/business/BusinessOnboardingPage.tsx
src/pages/business/BusinessIndex.tsx           (layout + BottomNav próprio)
src/pages/business/BusinessHomePage.tsx
src/pages/business/BusinessTransactionsPage.tsx
src/pages/business/BusinessSpreadsheetsPage.tsx
src/pages/business/BusinessComingSoonPage.tsx  (chat/cursos/metas/orcamentos)

src/lib/businessCategories.ts
src/lib/balanceSheet.ts
src/lib/balanceSheetPdf.ts

Atualizações:
- src/App.tsx: rotas /empresa/*, guard de onboarding empresarial, CompanyProvider
- src/pages/ProfilePage.tsx: card "🏢 Minha Empresa"
- hooks de transações/budgets/goals/cards/recurring: filtro por company_id via contexto
- index.css + tailwind.config.ts: tokens business
```

## Confirmações antes de começar

Se algo aqui não bater com sua visão (especialmente o switcher, a paleta sóbria ou o escopo do Balanço), me diga antes de eu implementar — depois fica mais caro mudar.
