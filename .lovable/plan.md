## Evolução completa da Harp.I.A.

Transformar a Harp em uma assistente financeira realmente inteligente, com contexto pessoal/empresa, respostas mais legíveis, sugestões úteis e baixo custo de tokens.

---

### 1. Contexto inteligente (pessoal e empresa)

- Criar `src/hooks/usePersonalContext.ts` análogo ao `useBusinessContext`, retornando **apenas agregados** (não transações cruas):
  - KPIs do mês: receita, despesa, saldo, taxa de poupança
  - Top 5 categorias de gasto do mês + variação % vs mês anterior
  - Orçamentos com % consumido e estourados
  - Metas em andamento (nome, progresso %)
  - Gastos recorrentes ativos (total mensal)
- Reaproveitar `useBusinessContext` (já existe), mas reduzir payload:
  - Remover `lastTransactions` cru → manter só top 5 categorias + variação
  - Manter KPIs, balanço, metas, orçamentos
- O `ChatPage` envia **um único** payload `context` baseado no `mode` ativo (nunca mistura).

### 2. Edge function `harp-ia-chat`

- Aceitar `context: { mode: 'personal' | 'business', data: {...} }` no lugar do atual `businessContext`.
- Dois system prompts distintos (personal vs business), mais curtos e diretos:
  - Estilo de resposta obrigatório (ver seção 3)
  - Regra anti-alucinação: "se não houver dado, diga 'ainda não tenho essa informação'"
- Limitar payload serializado a ~3 KB (já existe limite, ajustar).
- Manter histórico curto: enviar apenas as **últimas 8 mensagens** ao gateway (memória leve, economia de créditos).
- Continuar usando `google/gemini-2.5-flash`.

### 3. Formato de resposta padronizado

System prompt instrui a Harp a usar sempre esta estrutura quando relevante:

```text
## 📊 Resumo
(1-2 frases)

## 💸 Destaques
- item
- item

## 📈 Sugestões
- ação prática

## ⚠️ Atenção (opcional)
- alerta
```

Respostas curtas (saudação, definição rápida) podem fugir ao template — sem forçar.

### 4. UI do chat (ChatPage)

- **Bolhas**: assistente sem fundo (texto direto sobre a superfície), usuário com `gradient-primary`. Mais respiro: `py-4`, `gap-3` entre mensagens.
- **Markdown**: aumentar tipografia da prose, espaçamento entre headings (`prose-headings:mt-4 prose-headings:mb-2`), listas com bullets visíveis.
- **Loading "digitando"**: trocar dots por shimmer "Harp está pensando..." com pulse sutil.
- **Chips de sugestão rápida** abaixo do input (sempre visíveis, não só na tela vazia):
  - Pessoal: "Onde gasto mais?", "Resumo do mês", "Como economizar?"
  - Empresa: "Fluxo de caixa", "Lucro do mês", "Maior despesa"
- Campo de input mantém foco após enviar mensagem e ao trocar de conversa.
- Indicador "Modo empresa: {nome}" já existe — manter, melhorar contraste.

### 5. Insights automáticos no contexto

No hook de contexto, pré-calcular comparações para a IA não precisar fazer:

- Variação % de cada categoria top vs mês anterior
- Categorias com crescimento > 20%
- Orçamentos estourados
- Tendência de saldo (3 meses)

A IA recebe esses números prontos e apenas redige.

### 6. Economia de créditos

- Histórico cortado a 8 mensagens
- Contexto enviado: ~20 linhas de KPIs, nunca transações cruas
- System prompt enxuto (remover redundâncias do atual)
- Sem chamada à IA quando não há dado (chips desabilitados se mode business sem company)

### 7. Arquivos afetados

**Criar**
- `src/hooks/usePersonalContext.ts`
- `src/components/chat/QuickChips.tsx`
- `src/components/chat/TypingIndicator.tsx`

**Editar**
- `src/hooks/useBusinessContext.ts` — payload mais enxuto, com variações
- `src/pages/ChatPage.tsx` — UI nova, chips persistentes, foco no input, contexto unificado
- `supabase/functions/harp-ia-chat/index.ts` — dois system prompts, payload `context` unificado, janela de 8 mensagens

**Sem migração de banco** — toda a melhoria é frontend + edge function.

---

### Resultado esperado

- Respostas com hierarquia visual clara (títulos, listas, alertas)
- Harp responde "quanto gastei com lazer?" usando os agregados reais
- Sem inventar dados; admite quando falta informação
- UI mais limpa, premium, com chips úteis sempre à mão
- Custo por mensagem reduzido (~70% menos contexto enviado)
