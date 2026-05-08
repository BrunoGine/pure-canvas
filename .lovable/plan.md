# Refatoração de Login + Onboarding (atualizada)

Transformar o `AuthPage` atual (formulário único) num fluxo guiado e conversacional. Login enxuto, cadastro como jornada curta e personalizada, com login social, recuperação de senha real e edição posterior das respostas no Perfil.

## 1. Estrutura de telas

```text
WelcomeScreen ──► LoginScreen ──► (esqueci senha) ──► ForgotPasswordScreen
       │                                                      │
       │                                                      ▼
       │                                              email com link → /reset-password
       │
       └──► SignupFlow (multi-step)
                ├─ 1. Email + senha (ou Google/Apple) → cria conta
                ├─ 2. Nome
                ├─ 3. Renda mensal (chips + valor manual)
                ├─ 4. Objetivo financeiro principal (cards)
                ├─ 5. Costuma controlar gastos? (sim/às vezes/não)
                ├─ 6. Já tem reserva de emergência? (sim/não)
                └─ 7. Plano sugerido + "Aplicar automaticamente"
```

Barra de progresso fixa, botão "voltar" em todas as etapas, transições leves com `framer-motion`.

## 2. Tela de boas-vindas

Logo, headline curta, dois CTAs grandes: **Entrar** / **Criar conta**. Glass card já existente.

## 3. Login

Email + senha + botão "Continuar" com loading suave. Adições:

- Botões **Continuar com Google** e **Continuar com Apple** (acima ou abaixo do form, com separador "ou").
- Link discreto **Esqueci minha senha** → `ForgotPasswordScreen`.
- Mensagens de erro humanizadas (já existem).

### Login social (Google / Apple)

- Usa `supabase.auth.signInWithOAuth({ provider: 'google' | 'apple', options: { redirectTo: window.location.origin + '/auth/callback' } })`.
- Página `/auth/callback` apenas trata sessão e roteia: se `onboarding_completed = false`, vai para `/onboarding`; senão `/`.
- **Configuração**: providers Google e Apple precisam ser ativados no painel Supabase (Authentication → Providers) com as credenciais do Google Cloud / Apple Developer. Vou orientar o usuário com link direto e explicar as URLs de callback necessárias após implementar.

## 4. Cadastro multi-etapas

- Etapa 1 cria a conta no Supabase (`signUp` ou OAuth) imediatamente. Próximas etapas só atualizam perfil.
- 1 pergunta por tela, fonte grande, opções como cards/chips + input manual onde aplicável.
- Persistência temporária em `localStorage` (`onboarding_draft`) para retomar.
- Validação amigável inline.

## 5. Página `/reset-password` real

Fluxo completo:

1. **`ForgotPasswordScreen`** (`/auth?mode=forgot` ou tela embutida no AuthPage):
   - Input de email + botão "Enviar link".
   - Chama `supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/reset-password' })`.
   - Confirmação visual ("Verifique seu email").

2. **`/reset-password`** (página pública, fora do `ProtectedRoutes`):
   - Detecta `type=recovery` no hash da URL e estabelece sessão de recovery.
   - Form com nova senha + confirmação.
   - Chama `supabase.auth.updateUser({ password })`.
   - Sucesso → toast + redireciona para `/`.
   - Trata erros: link expirado, sessão inválida, senhas divergentes.

3. **Roteamento em `App.tsx`**: `/reset-password` deve ser rota pública (igual `/auth`), nunca dentro do gate de auth.

4. (Opcional, perguntar) Customização de templates de email com a marca via Lovable Cloud Emails — não fazer agora a menos que o usuário peça.

## 6. Persistência dos dados do onboarding

Migration adicionando colunas a `profiles`:

- `monthly_income numeric`
- `financial_goal text` (save / debt / invest / control / organize)
- `tracks_expenses text` (yes / sometimes / no)
- `has_emergency_fund boolean`
- `onboarding_completed boolean default false`

Gate em `ProtectedRoutes`: se `session` existe e `onboarding_completed = false`, redireciona para `/onboarding`.

## 7. Geração do plano (sem IA)

`src/lib/financialPlan.ts` puro, regras fixas baseadas em 50/30/20 ajustadas:

- Sem reserva → reserva sobe para 15–20%, lazer cai.
- Objetivo "sair das dívidas" → 25% para quitação, investimentos caem.
- "Investir" → 20% investimentos.
- Renda < R$1500 → essenciais 60%, lazer 10%.

Saída: percentuais + valores em R$ (essenciais, lazer, metas, reserva, investimentos).

## 8. "Aplicar automaticamente"

Reusa hooks existentes:

- **`budgets`**: um por categoria sugerida.
- **`goals`**: meta "Reserva de emergência" se ainda não há (target = 6× essenciais).
- Marca `onboarding_completed = true` → vai para `/`.

Botão secundário **"Pular por agora"** também marca como completo, sem criar nada.

## 9. Edição posterior no Perfil

Em `src/pages/ProfilePage.tsx`, nova seção **"Meu perfil financeiro"**:

- Mostra valores atuais (renda, objetivo, controle de gastos, reserva) em cards legíveis.
- Cada card tem botão "Editar" → abre dialog reaproveitando os mesmos componentes de step do onboarding (`steps/IncomeStep`, `GoalStep`, etc., parametrizados como `mode: "edit"` para esconder progress bar e usar título compacto).
- Salva direto via `supabase.from("profiles").update(...)`.
- Botão "Recalcular meu plano" → reabre a tela de plano sugerido (`PlanReview`) com opção de aplicar de novo (cria/atualiza orçamentos correspondentes; pergunta antes de sobrescrever existentes).
- Botão "Refazer onboarding completo" (opção destrutiva leve) → seta `onboarding_completed = false` e redireciona para `/onboarding`.

## 10. Design

- Liquid glass existente, blobs ambientais.
- Tipografia grande nas perguntas (`text-3xl font-display`).
- Chips/cards com `hover:shadow-glow` e seleção `ring-2 ring-primary`.
- `Progress` shadcn no topo do onboarding.
- Mobile-first, `max-w-md` centrado.
- Botões sociais com ícones de marca (lucide / SVG inline).

## 11. Detalhes técnicos

**Arquivos novos:**
- `src/pages/AuthPage.tsx` (reescrito → roteador welcome/login/forgot/signup)
- `src/pages/AuthCallbackPage.tsx` (trata OAuth + roteia por onboarding)
- `src/pages/ResetPasswordPage.tsx`
- `src/pages/OnboardingPage.tsx`
- `src/components/auth/WelcomeScreen.tsx`
- `src/components/auth/LoginForm.tsx`
- `src/components/auth/SocialAuthButtons.tsx` (Google + Apple)
- `src/components/auth/ForgotPasswordForm.tsx`
- `src/components/auth/SignupCredentialsStep.tsx`
- `src/components/onboarding/OnboardingShell.tsx`
- `src/components/onboarding/steps/{Name,Income,Goal,Tracking,Emergency,PlanReview}.tsx`
- `src/components/profile/FinancialProfileSection.tsx`
- `src/components/profile/EditFinancialAnswerDialog.tsx`
- `src/lib/financialPlan.ts`
- `src/hooks/useOnboarding.ts`
- `src/hooks/useFinancialProfile.ts`

**Arquivos editados:**
- `src/App.tsx`: rotas públicas `/auth`, `/auth/callback`, `/reset-password`; gate de onboarding em `ProtectedRoutes`.
- `src/pages/ProfilePage.tsx`: nova seção financeira.
- Migration Supabase: novas colunas em `profiles`.

**Sem IA, sem novas edge functions.** Reaproveita `useBudgets`, `useGoals`, supabase client.

## 12. Configuração externa necessária (após implementar)

Vou avisar o usuário com instruções e links:

- **Google**: criar OAuth Client no Google Cloud, adicionar Supabase callback URL, ativar provider no dashboard Supabase.
- **Apple**: criar Service ID + Key no Apple Developer, configurar provider no Supabase. (Apple exige conta paga; se não tiver, deixar botão Apple oculto via flag.)
- **Site URL / Redirect URLs** no Supabase: adicionar a URL de preview e o domínio de produção para que reset de senha e OAuth funcionem.

## Fora de escopo
- Customização visual dos emails de auth (Lovable Cloud Emails) — perguntar separadamente.
- 2FA / login por magic link.
