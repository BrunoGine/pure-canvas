
# Sistema de Push Notifications — PWA + arquitetura desacoplada

Web Push real funcionando hoje (Android/iOS 16.4+/Desktop) com uma camada de abstração que permite plugar FCM, APNs ou OneSignal depois **sem refazer banco, edge functions nem UI**.

---

## 1. Banco de dados (1 migração)

**Tabelas novas** (todas com GRANTs + RLS escopada a `auth.uid()`):

- `notification_devices` — um registro por dispositivo/navegador
  - `user_id`, `provider` (`'web_push' | 'fcm' | 'apns' | 'onesignal'`), `token` (endpoint para web push, FCM token depois), `p256dh`, `auth` (chaves VAPID do navegador), `platform` (`web|android|ios`), `user_agent`, `last_seen_at`, `enabled`, `created_at`
  - UNIQUE(`user_id`, `token`)
- `notification_preferences` — uma linha por usuário
  - `user_id` PK, `master_enabled`, mais um booleano por categoria: `financial`, `goals`, `courses`, `streak`, `harpia`, `business`, `shared_goals`, `security`, `marketing`
  - `quiet_hours_start`, `quiet_hours_end`, `timezone`
  - Trigger `handle_new_user` ganha INSERT default (`security` sempre true)
- `notification_logs` — auditoria + dedupe + rate limit
  - `user_id`, `category`, `dedupe_key`, `title`, `body`, `data jsonb`, `status` (`sent|skipped|failed`), `skip_reason`, `provider_response jsonb`, `sent_at`
  - Índices: (`user_id`, `category`, `sent_at desc`), (`user_id`, `dedupe_key`)

**RPCs SECURITY DEFINER:**
- `register_notification_device(provider, token, p256dh, auth, platform, ua)` — upsert idempotente
- `unregister_notification_device(token)`
- `can_send_notification(_user_id, _category, _dedupe_key, _cooldown_minutes, _daily_cap)` → boolean — checa master + categoria + quiet hours (no fuso do usuário) + cooldown + dedupe + cap diário

---

## 2. PWA + Service Worker (mínimo necessário para Web Push)

Aviso importante: PWA só funciona no app publicado, não no preview do Lovable.

- Adicionar `vite-plugin-pwa` com `devOptions.enabled: false`, `NetworkFirst` para HTML, `navigateFallbackDenylist: [/^\/~oauth/]`
- Em `src/main.tsx`: guard para **não registrar** SW em iframe nem em hosts `lovableproject.com`/`id-preview--`
- `manifest.webmanifest` com nome, ícones, `display: standalone`
- `public/sw.js` customizado com handlers `push` e `notificationclick` (abre/foca janela na rota do `data.url`)

---

## 3. Camada de abstração de provider (frontend)

`src/lib/push/` — interface única, troca de provider via 1 arquivo:

```text
src/lib/push/
  types.ts              PushProvider interface
  webPushProvider.ts    implementa via navigator.serviceWorker.pushManager
  index.ts              export const pushProvider = webPushProvider
                        (amanhã: fcmProvider, onesignalProvider)
```

Cada provider expõe: `isSupported()`, `getPermission()`, `requestPermission()`, `subscribe()` → token, `unsubscribe()`.

---

## 4. Edge functions

**`push-send`** (central, chamada por todos os triggers):
- Input: `{ user_id, category, dedupe_key, title, body, data, cooldown_minutes?, daily_cap? }`
- Chama `can_send_notification` → se false, loga `skipped` e retorna
- Busca devices ativos do user, despacha por provider (hoje só `web_push` via VAPID + `npm:web-push`), grava `notification_logs`
- Limpa tokens com 410/404

**`push-vapid-public-key`** — devolve a public key VAPID (secret) pro frontend usar no subscribe

**Secrets a criar:** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` (`mailto:...`)

**Triggers do MVP** (todos via `push-send`):
- `notify-budget-threshold` — cron diário + após insert de `manual_transactions`; checa orçamento ≥80%
- `notify-weekly-summary` — cron domingo 19h (no fuso do user)
- `notify-goal-progress` — trigger DB em update de `goals.current_amount` cruzando marcos (25/50/75/90%)
- `notify-shared-goal-events` — trigger em `shared_goal_contributions` + `shared_goal_join_requests`
- `notify-streak-risk` — cron diário 19h se streak ativo e sem atividade hoje
- `notify-level-up` — já existe lógica em `award_xp`; adicionar chamada
- `notify-security` — hook em mudança de senha + novo login (via `touch_last_seen`/auth webhook); **sempre enviado**, ignora master toggle

Reuso: criamos helper compartilhado `_shared/push.ts` que invoca `push-send`.

---

## 5. UX de permissão (contextual, não invasiva)

- **Não pede no load**. Componente `<PushPermissionPrompt/>` aparece como bottom sheet **após** primeiras ações de valor: criar meta, registrar 1ª transação, completar 1ª lição
- Estado `push_prompt_dismissed_at` em `localStorage` — não re-perguntar antes de 7 dias
- Se aceito → `subscribe()` → `register_notification_device` → toast de sucesso
- Tela `/perfil/notificacoes` com:
  - Toggle master grande no topo + estado da permissão do navegador
  - Card por categoria com toggle + descrição curta + ícone
  - Card de horário silencioso (sliders de hora)
  - Lista de dispositivos registrados com botão "remover"
  - Botão "Enviar notificação de teste"
- Hook `usePushPermission()` + `useNotificationPreferences()` com optimistic update (padrão do `usePrivacySettings`)
- Entrada nova em `ProfilePage` menu: "Notificações" → `/perfil/notificacoes`

---

## 6. Anti-spam (regras no `can_send_notification`)

- **Master off** → skip tudo (exceto `security`)
- **Categoria off** → skip
- **Quiet hours** (default 22h–8h no fuso do user) → skip não-críticos
- **Cooldown por dedupe_key** (ex: orçamento Lazer 80% só 1x/dia)
- **Cap diário por categoria** (financial: 3, goals: 2, marketing: 1, security: ilimitado)
- **Cap global**: máx 6 notificações/dia

---

## 7. Detalhes técnicos

- Web Push usa `npm:web-push` no edge (Deno suporta via npm specifier)
- Encryption payload AES128GCM já cuidado pela lib
- `notificationclick` no SW: `clients.matchAll` → foca janela existente ou abre `data.url`
- iOS PWA: notificações só funcionam se instalado como home screen + iOS 16.4+. Mostrar dica na tela de configurações quando detectar Safari iOS não-instalado
- Tipos do Supabase serão regenerados após a migração

---

## 8. O que NÃO entra agora (preparado pra depois)

- FCM Android/iOS nativo (precisa Capacitor + projeto Firebase)
- APNs direto (precisa Apple Developer)
- Notificações via Harp.I.A (insights gerados por IA) — categoria já existe, trigger fica para versão 2
- Cron de horário inteligente baseado em atividade (estrutura `timezone` já fica salva)

---

## Ordem de execução

1. Migração: tabelas + RPCs + RLS + GRANTs + trigger no handle_new_user
2. Secrets VAPID
3. Edge function `push-send` + `push-vapid-public-key`
4. Triggers (cron + DB triggers + edge functions de notificação)
5. PWA setup (vite-plugin-pwa + sw.js + guards)
6. Camada `src/lib/push/` + hooks
7. Tela `/perfil/notificacoes` + entrada no menu
8. `<PushPermissionPrompt/>` contextual
9. Botão de teste e validação ponta-a-ponta no app publicado
