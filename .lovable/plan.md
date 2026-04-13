
## Botão "Categoria do gasto" com gráfico individual

### O que será feito

Adicionar um botão destacado **"Categoria do gasto"** no `SpreadsheetsPage.tsx` (na aba Dashboard ou acima dos gráficos). Ao clicar, abre um **Dialog/Sheet** com a lista de categorias disponíveis. O usuário seleciona uma categoria e vê um gráfico dedicado mostrando **receitas vs despesas** daquela categoria ao longo dos meses, com totais resumidos.

### Implementação

1. **Novo componente `CategorySpendingDialog.tsx`**
   - Dialog modal com lista de categorias (botões/chips)
   - Ao selecionar uma categoria, exibe:
     - Cards com total de receitas e despesas daquela categoria
     - Gráfico de barras (BarChart) com receitas vs despesas por mês
     - Lista das maiores transações
   - Botão para voltar à lista de categorias ou fechar

2. **Alteração em `SpreadsheetsPage.tsx`**
   - Adicionar botão "Categoria do gasto" na aba Dashboard, antes dos gráficos existentes
   - Estado `categoryDialogSpendingOpen` para controlar o dialog
   - Passar `transactions` e `categories` como props ao novo componente

### Arquivos
- **Criar**: `src/components/spreadsheets/CategorySpendingDialog.tsx`
- **Editar**: `src/pages/SpreadsheetsPage.tsx` — adicionar botão e integrar o dialog
