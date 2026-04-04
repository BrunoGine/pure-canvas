import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface ManualTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

interface BankTx {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string | null;
  type: string;
}

interface TransactionTableProps {
  manualTransactions?: ManualTransaction[];
  bankTransactions?: BankTx[];
  onRemoveManual?: (id: string) => void;
  showSource?: boolean;
}

const TransactionTable = ({ manualTransactions = [], bankTransactions = [], onRemoveManual, showSource }: TransactionTableProps) => {
  const rows = [
    ...manualTransactions.map(t => ({ ...t, source: "Manual" as const })),
    ...bankTransactions.map(t => ({
      id: t.id,
      description: t.description,
      amount: Number(t.amount),
      type: t.type as "income" | "expense",
      category: t.category || "—",
      date: t.date,
      source: "Banco" as const,
    })),
  ].sort((a, b) => b.date.localeCompare(a.date));

  if (rows.length === 0) {
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
              {showSource && <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Origem</th>}
              <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Valor</th>
              <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(tx => (
              <tr key={tx.id} className="animate-fade-in">
                <td className="px-4 py-3">
                  <p className="font-medium">{tx.description}</p>
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">{tx.category}</td>
                {showSource && (
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${tx.source === "Banco" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {tx.source}
                    </span>
                  </td>
                )}
                <td className={`px-4 py-3 text-right font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                  {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-center">
                  {tx.source === "Manual" && onRemoveManual ? (
                    <button onClick={() => onRemoveManual(tx.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  ) : null}
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
