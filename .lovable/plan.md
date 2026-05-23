## Visão geral

O app hoje é web/PWA (sem Capacitor instalado). O Supabase já mantém sessão em `localStorage` com refresh automático — não há perda de sessão. Falta:

1. Um toggle real de **"Manter conectado"** que controle se a sessão persiste entre fechamentos.
2. **Biometria via WebAuthn** (Face ID, Touch ID, Windows Hello, digital Android) — funciona nativamente em navegadores modernos, em PWA instalado e dentro de wrapper Capacitor sem dependência extra.
3. Uma **tela de bloqueio biométrica** que protege o app na reabertura/inatividade, sem deslogar do Supabase.
4. Uma seção **"Segurança e acesso"** no Perfil com toggles funcionais e botão "Esquecer este dispositivo".

A biometria **não substitui** a autenticação do Supabase — ela apenas desbloqueia uma sessão já válida (modelo de Nubank/Inter).

## Arquitetura

```text
┌─────────────────────────────────────────────────────────┐
│ AuthProvider (Supabase session — refresh automático)    │
│   └─ SecurityProvider (novo)                            │
│        ├─ rememberMe        (persistência de sessão)    │
│        ├─ biometricEnabled  (toggle por dispositivo)    │
│        ├─ lastActiveAt      (timeout de inatividade)    │
│        ├─ locked            (mostra BiometricLock)      │
│        └─ unlock()/lock()/forgetDevice()                │
│             └─ AppContent ou <BiometricLockScreen/>     │
└─────────────────────────────────────────────────────────┘
```

### Banco de dados (1 tabela nova)

`device_credentials` — vincula credenciais WebAuthn a um usuário, permitindo no futuro listar/revogar dispositivos.

Campos de domínio:
- `device_label` (ex.: "Chrome no Windows")
- `credential_id` (id público da credencial WebAuthn, base64)
- `public_key` (chave pública da credencial, base64)
- `sign_count` (contador anti-replay)
- `last_used_at`
- `created_at`

Acesso: cada usuário lê/cria/remove apenas suas próprias credenciais. Admins não têm acesso especial.

### Storage local (por dispositivo)

`localStorage` (não-sensível, apenas flags):
- `security.rememberMe` — boolean
- `security.biometricEnabled` — boolean
- `security.credentialId` — id da credencial WebAuthn neste dispositivo
- `security.lastActiveAt` — timestamp ISO

Nada de senha ou token cru é gravado. A sessão Supabase continua no storage padrão do SDK.

### Fluxos

**1. Login normal**
- Tela de login ganha checkbox "Manter conectado neste dispositivo" (padrão: ligado).
- Se desligado: troca o storage do Supabase para `sessionStorage` *antes* do `signInWithPassword` (a sessão evapora ao fechar a aba).
- Após login bem-sucedido, se o navegador suporta WebAuthn e ainda não há biometria neste dispositivo, abre um bottom-sheet elegante: "Entrar com biometria da próxima vez?" → registra credencial.

**2. Registro de biometria (WebAuthn `create`)**
- `navigator.credentials.create()` com `authenticatorAttachment: "platform"` e `userVerification: "required"`.
- Salva `credentialId` + `publicKey` em `device_credentials` (Supabase) e `credentialId` em `localStorage`.
- Mostra confirmação visual com animação de check.

**3. Reabertura do app / inatividade**
- Ao montar o `SecurityProvider`:
  - Se há sessão Supabase válida **e** `biometricEnabled` **e** (`lastActiveAt` ausente ou > 5 min atrás) → `locked = true`.
  - Caso contrário libera direto.
- `BiometricLockScreen` chama `navigator.credentials.get()` com `allowCredentials: [credentialId]` e `userVerification: "required"`.
- Sucesso → atualiza `last_used_at` na tabela, `locked = false`, atualiza `lastActiveAt`.
- Falha/cancelamento → botão "Usar senha" que desloga e volta para `/auth` (fallback seguro).

**4. Atividade do usuário**
- Listener leve em `visibilitychange` + `focus`: ao voltar ao foco, se `now - lastActiveAt > 5 min` e biometria ativa → bloqueia.
- Durante uso normal (clique, scroll), atualiza `lastActiveAt` a cada 30s no máximo (debounce). Nunca bloqueia durante uso ou troca de aba curta.

**5. Timeout de "Manter conectado"**
- Se passar mais de 30 dias sem `lastActiveAt`, ao abrir o app: `signOut()` automático e redireciona para login. Configurável depois.

**6. Esquecer este dispositivo**
- Remove a credencial deste navegador da tabela `device_credentials`.
- Limpa as chaves `security.*` do `localStorage`.
- `signOut()` do Supabase.

### Detecção de suporte

`window.PublicKeyCredential && await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()` → se falso, **esconde** todas as opções de biometria (toggle, prompt, lock screen). O resto continua funcionando.

## UI

**Login (`LoginForm.tsx`)**
- Checkbox "Manter conectado neste dispositivo" abaixo da senha.

**Após login (modal `EnableBiometricSheet`)**
- Aparece uma vez, dispensável. Ícone de digital animado, copy "Desbloqueie rapidamente com sua digital" / "Este dispositivo será lembrado com segurança". Botões "Ativar" e "Agora não".

**`BiometricLockScreen.tsx`**
- Fundo `gradient-primary` suave, avatar do usuário, ícone de digital com pulse, botão grande "Desbloquear com biometria", link discreto "Usar senha".

**Perfil → nova seção "Segurança e acesso"** (`SecuritySection.tsx`)
- Toggle "Manter conectado"
- Toggle "Usar biometria" (escondido se não suportado)
- Botão "Esquecer este dispositivo" em texto destrutivo

Tudo segue tokens do design system existente (`glass-card`, `gradient-primary`, `shadow-glow`, motion).

## Arquivos

**Novos**
- `src/contexts/SecurityContext.tsx` — provider central
- `src/lib/webauthn.ts` — helpers (`isBiometricSupported`, `registerCredential`, `verifyCredential`, `base64url` utils)
- `src/lib/secureStorage.ts` — wrapper que escolhe `localStorage` vs `sessionStorage` para o cliente Supabase
- `src/components/security/BiometricLockScreen.tsx`
- `src/components/security/EnableBiometricSheet.tsx`
- `src/components/security/SecuritySection.tsx`
- `src/hooks/useDeviceCredentials.ts`
- `supabase/migrations/<timestamp>_device_credentials.sql`

**Editados**
- `src/integrations/supabase/client.ts` — usar `secureStorage`
- `src/contexts/AuthContext.tsx` — pequena ajuste para expor `rememberMe`
- `src/components/auth/LoginForm.tsx` — checkbox + lógica
- `src/App.tsx` — envolver `ProtectedRoutes` com `SecurityProvider`, renderizar `BiometricLockScreen` quando `locked`
- `src/pages/ProfilePage.tsx` — incluir `SecuritySection`

## Garantias contra os riscos citados

- **Sem loop de auth**: o `SecurityProvider` nunca chama `signOut` em re-render; só age em eventos discretos (`visibilitychange`, `focus`, mutação de toggle). `AuthContext` continua com listener único.
- **Sem múltiplos listeners**: providers usam `useEffect` com cleanup, sem dependências instáveis.
- **Sem perda de sessão**: o Supabase continua autorefresh; biometria só controla a tela de bloqueio local.
- **Sem dados sensíveis em claro**: tokens permanecem onde o SDK do Supabase os coloca; nada novo é gravado em claro.
- **Fallback**: falha de biometria sempre oferece "Usar senha".
- **Detecção**: dispositivos sem WebAuthn nem veem a opção.

## Fora do escopo desta entrega (preparado para o futuro)

- Listagem visual de "dispositivos conectados" (a tabela já suporta).
- Revogação remota de outros dispositivos (precisa de realtime; estrutura pronta).
- Capacitor `@capacitor-community/biometric-auth` (não necessário: WebAuthn cobre os três alvos).
