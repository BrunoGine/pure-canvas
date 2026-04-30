## Diagnóstico

O cadastro está falhando com erro **HTTP 429 — `over_email_send_rate_limit`** ("email rate limit exceeded"). Não é um bug no código — é uma limitação do **servidor SMTP padrão do Supabase**, que envia no máximo poucos e-mails por hora (≈3-4/h em projetos novos). Como você fez vários testes seguidos com `blackzinnn0@gmail.com` e `blackpe013@gmail.com`, o limite estourou e agora qualquer novo cadastro é bloqueado.

Há duas dimensões a resolver:

1. **Curto prazo (UX):** o usuário hoje vê apenas "Ocorreu um erro. Tente novamente." — mensagem genérica e confusa. Precisamos detectar o `429` / `over_email_send_rate_limit` e mostrar uma mensagem clara.
2. **Médio prazo (infra):** remover de fato o limite, configurando um provedor de e-mail próprio **ou** desativando a confirmação por e-mail.

## O que vou fazer no código

Editar `src/pages/AuthPage.tsx` no `catch` do `handleSubmit`:

- Detectar `error?.status === 429` ou `error?.code === 'over_email_send_rate_limit'` ou mensagem contendo `email rate limit`.
- Mostrar toast específico: **"Muitas tentativas de cadastro. Aguarde alguns minutos e tente novamente, ou use outro e-mail."**
- Adicionar também tradução para `Email rate limit exceeded` no mapa `errorMessages`.

Nenhum outro arquivo precisa ser alterado.

## O que VOCÊ precisa fazer (fora do código)

Para eliminar o problema na raiz, escolha **uma** das opções no painel do Supabase:

### Opção A — Desativar confirmação de e-mail (mais rápido, recomendado para dev/MVP)
1. Abrir **Authentication → Sign In / Providers → Email**
2. Desligar **"Confirm email"**
3. Usuários entram direto após cadastrar, sem precisar confirmar caixa de entrada → o rate limit deixa de ser atingido.

### Opção B — Configurar SMTP próprio (recomendado para produção)
1. Abrir **Authentication → Emails → SMTP Settings**
2. Conectar um provedor (Resend, SendGrid, Brevo, AWS SES, Gmail SMTP…)
3. Limites passam a ser os do seu provedor (Resend grátis = 3.000/mês, por exemplo).

### Esperar
Se preferir não mexer agora, o limite reseta sozinho em **~1 hora**. Depois disso o cadastro volta a funcionar normalmente — mas vai estourar de novo se você fizer muitos testes seguidos.

## Resumo

- Mudança de código: melhorar mensagem de erro 429 no `AuthPage.tsx`.
- Ação sua: escolher Opção A (desligar confirm email) ou Opção B (SMTP próprio) no painel Supabase para remover o limite definitivamente.