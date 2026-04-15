

## Plano: Melhorar botões de anotação e apagar para mobile

### Problema
Os botões usam `Tooltip` (hover), que não funciona em telas touch. Os ícones são pequenos (14px), difíceis de tocar no celular.

### Solução
Substituir o `Tooltip` por um `Popover` (abre ao clicar) para exibir a anotação, e aumentar o tamanho dos ícones e a área de toque dos botões.

### Alterações

**1. `src/components/spreadsheets/TransactionTable.tsx`**
- Substituir `Tooltip` por `Popover` do shadcn para o botão de anotação
- Aumentar ícones de 14px para 18px
- Adicionar padding nos botões (`p-2`) para aumentar a área de toque
- Aumentar gap entre botões de `gap-1` para `gap-2`

**2. `src/pages/HomePage.tsx`**
- Mesmas alterações: `Tooltip` → `Popover`, ícones maiores (18px), área de toque maior

### Detalhes técnicos
- Imports: trocar `Tooltip/TooltipContent/TooltipProvider/TooltipTrigger` por `Popover/PopoverContent/PopoverTrigger` do `@/components/ui/popover`
- O `Popover` abre com click (padrão), funcionando tanto em desktop quanto mobile

