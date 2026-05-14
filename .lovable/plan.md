## Objetivo

Permitir que o usuário exclua uma empresa criada, com confirmação obrigatória avisando que a ação é permanente. O perfil pessoal nunca pode ser excluído — apenas empresas.

## Onde aparece o botão

No card **"Minha Empresa" / "Gerenciar empresa"** (`BusinessEntryCard`) na página de Perfil. Quando o usuário tiver pelo menos uma empresa, exibir um pequeno ícone de lixeira (`Trash2`) à direita do card, separado da ação principal de entrar/sair do modo empresa. O botão só aparece quando `companies.length > 0`.

Não haverá botão equivalente para o perfil pessoal — ele é intrínseco à conta.

## Fluxo de confirmação

Ao clicar na lixeira, abrir um `AlertDialog` (shadcn) com:

- **Título:** "Excluir empresa?"
- **Descrição:** "Esta ação é permanente. Todos os dados vinculados a **{nome da empresa}** serão perdidos, incluindo transações, orçamentos, cartões, lançamentos recorrentes e metas associadas. Essa ação não pode ser desfeita."
- **Botões:** "Cancelar" e "Excluir definitivamente" (variante destrutiva).

Se houver mais de uma empresa, mostrar um seletor para escolher qual excluir antes da confirmação. Se só houver uma, ir direto para a confirmação dela.

## Lógica de exclusão

Ao confirmar:

1. Se a empresa a excluir for a `activeCompanyId`, sair do modo empresa (`exitBusinessMode`) e limpar `active_company_id` em `profiles`.
2. Apagar dados relacionados em ordem (filtrando por `user_id = auth.uid()` e `company_id = X`):
   - `manual_transactions`
   - `recurring_transactions`
   - `budgets`
   - `credit_cards`
   - `conversations` (e suas `chat_messages` via `conversation_id`)
   - `goals` com `company_id = X`
3. Apagar a linha em `companies`.
4. `refreshCompanies()` no contexto.
5. Toast de sucesso.

Tudo é feito via cliente Supabase usando as RLS já existentes (`auth.uid() = user_id`). Nenhuma migração é necessária.

## Arquivos a editar

- `src/components/business/BusinessEntryCard.tsx` — adicionar botão lixeira, AlertDialog e função `handleDelete`.
- `src/contexts/CompanyContext.tsx` — expor helper `deleteCompany(companyId)` que executa as exclusões em cascata e limpa `activeCompanyId` se necessário.

## Detalhes técnicos

- Usar `AlertDialog` de `@/components/ui/alert-dialog`.
- Para `chat_messages`, primeiro buscar `conversation.id` por `company_id`, depois deletar mensagens, depois conversas.
- Estado de loading no botão de confirmação para evitar duplo clique.
