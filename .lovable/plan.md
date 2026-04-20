

## Plano

### Mudança
Substituir o filtro atual (Ambos / Crédito / Débito) nos gráficos por um filtro completo com **todas as formas de pagamento** disponíveis ao criar uma transação, e renomear "Ambos" para **"Todos"**.

### Opções do filtro (na ordem)
1. **Todos** (default) — não filtra
2. **Pix**
3. **Crédito**
4. **Débito**
5. **Dinheiro (à vista)**
6. **Boleto**
7. **Transferência**

(Mesma lista de `src/lib/paymentMethods.ts`.)

### Arquivos afetados

**1. `src/components/spreadsheets/MonthlyOverview.tsx`**
- Trocar o tipo `MethodFilter = "all" | "credito" | "debito"` por `string` (qualquer valor de `paymentMethods` ou `"all"`).
- Importar `paymentMethods` de `@/lib/paymentMethods`.
- Substituir os 3 `<SelectItem>` fixos por `.map` sobre `paymentMethods`, mantendo `"all"` (rótulo "Todos") no topo.
- Ajustar largura do `SelectTrigger` de `w-[110px]` para `w-[140px]` para caber rótulos como "Transferência" e "Dinheiro (à vista)".
- Lógica de filtro: `methodFilter === "all"` → todas; senão `t.payment_method === methodFilter`.

**2. `src/components/spreadsheets/CategoryBreakdown.tsx`**
- Mesmas mudanças (tipo, import, map, largura do trigger).

**3. `src/components/spreadsheets/CategorySpendingDialog.tsx`**
- Aplicar a mesma substituição para manter consistência (também tem o filtro Ambos/Crédito/Débito).

### Observações
- Sem mudança de dados nem de DB — `payment_method` já é salvo como o `value` do `paymentMethods`.
- "Todos" continua incluindo transações sem `payment_method` definido (legado).
- Sem novas dependências.

