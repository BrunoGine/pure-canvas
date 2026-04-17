import { Trash2, StickyNote } from "lucide-react";
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
}

interface TransactionTableProps {
  manualTransactions?: ManualTransaction[];
  onRemoveManual?: (id: string) => void;
}

const TransactionTable = ({ manualTransactions = [], onRemoveManual }: TransactionTableProps) => {
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
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Descrição</th>
              <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Valor</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-20"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {manualTransactions.map(tx => (
              <tr key={tx.id} className="animate-fade-in">
                <td className="px-4 py-3">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">
                    {tx.date}{tx.payment_method ? ` · ${paymentMethodLabel(tx.payment_method)}` : ""}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{tx.category}</td>
                <td className={`px-4 py-3 text-right font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-2">
                    {tx.notes && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button className="p-2 text-muted-foreground hover:text-primary transition-colors">
                            <StickyNote size={18} />
                          </button>
                        </PopoverTrigger>
                        <PopoverContent side="top" className="max-w-[220px] p-3">
                          <p className="text-xs">{tx.notes}</p>
                        </PopoverContent>
                      </Popover>
                    )}
                    {onRemoveManual ? (
                      <button onClick={() => onRemoveManual(tx.id)} className="p-2 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={18} />
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
};

export default TransactionTable;
