import { Trash2, StickyNote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface ManualTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
  notes?: string | null;
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
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{tx.category}</td>
                <td className={`px-4 py-3 text-right font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  <div className="flex items-center justify-center gap-1">
                    {tx.notes && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button className="text-muted-foreground hover:text-primary transition-colors">
                              <StickyNote size={14} />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[200px]">
                            <p className="text-xs">{tx.notes}</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    {onRemoveManual ? (
                      <button onClick={() => onRemoveManual(tx.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={14} />
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
