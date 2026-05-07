import { Trash2, StickyNote, Pencil } from "lucide-react";
import { Fragment, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { paymentMethodLabel } from "@/lib/paymentMethods";

interface ManualTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string | null;
  payment_method?: string | null;
  card_id?: string | null;
}

interface TransactionTableProps {
  manualTransactions?: ManualTransaction[];
  onRemoveManual?: (id: string) => void;
  onEditManual?: (tx: ManualTransaction) => void;
}

const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

const monthLabel = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "Sem data";
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

const monthKey = (dateStr: string) => {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "0000-00";
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
};

const TransactionTable = ({ manualTransactions = [], onRemoveManual, onEditManual }: TransactionTableProps) => {
  const groups = useMemo(() => {
    const sorted = [...manualTransactions].sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
    const map = new Map<string, { label: string; items: ManualTransaction[] }>();
    for (const tx of sorted) {
      const key = monthKey(tx.date);
      if (!map.has(key)) map.set(key, { label: monthLabel(tx.date), items: [] });
      map.get(key)!.items.push(tx);
    }
    return Array.from(map.entries()).map(([key, val]) => ({ key, ...val }));
  }, [manualTransactions]);

  if (manualTransactions.length === 0) {
    return (
      <Card className="shadow-card">
        <CardContent className="p-8 text-center text-muted-foreground text-sm">
          Nenhuma transação encontrada.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-3 sm:px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Descrição</th>
              <th className="hidden sm:table-cell px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
              <th className="px-3 sm:px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Valor</th>
              <th className="px-2 sm:px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-20 sm:w-28"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {groups.map(group => (
              <>
                <tr key={`h-${group.key}`} className="bg-muted/30">
                  <td colSpan={4} className="px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {group.label}
                  </td>
                </tr>
                {group.items.map(tx => (
                  <tr key={tx.id} className="animate-fade-in">
                    <td className="px-3 sm:px-4 py-3 min-w-0">
                      <p className="font-medium break-words">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.date}{tx.payment_method ? ` · ${paymentMethodLabel(tx.payment_method)}` : ""}
                      </p>
                      <p className="text-xs text-muted-foreground sm:hidden mt-0.5">{tx.category}</p>
                    </td>
                    <td className="hidden sm:table-cell px-4 py-3 text-xs text-muted-foreground">{tx.category}</td>
                    <td className={`px-3 sm:px-4 py-3 text-right font-semibold whitespace-nowrap ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                      {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-2 sm:px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-1 sm:gap-2">
                        {tx.notes && (
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary transition-colors">
                                <StickyNote size={16} />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent side="top" className="max-w-[220px] p-3">
                              <p className="text-xs">{tx.notes}</p>
                            </PopoverContent>
                          </Popover>
                        )}
                        {onEditManual ? (
                          <button onClick={() => onEditManual(tx)} className="p-1.5 sm:p-2 text-muted-foreground hover:text-primary transition-colors" aria-label="Editar">
                            <Pencil size={16} />
                          </button>
                        ) : null}
                        {onRemoveManual ? (
                          <button onClick={() => onRemoveManual(tx.id)} className="p-1.5 sm:p-2 text-muted-foreground hover:text-destructive transition-colors" aria-label="Remover">
                            <Trash2 size={16} />
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TransactionTable;
