import { Card, CardContent } from "@/components/ui/card";
import { BankAccount } from "@/hooks/useBankData";
import { Wallet } from "lucide-react";

interface Props {
  accounts: BankAccount[];
}

const AccountsSummary = ({ accounts }: Props) => {
  if (accounts.length === 0) return null;

  return (
    <Card className="shadow-card">
      <CardContent className="p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <Wallet size={16} className="text-primary" />
          Contas Bancárias
        </h3>
        <div className="space-y-2">
          {accounts.map(acc => (
            <div key={acc.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{acc.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{acc.account_type.toLowerCase()} • {acc.currency}</p>
              </div>
              <p className={`font-semibold ${Number(acc.balance) >= 0 ? "text-primary" : "text-destructive"}`}>
                R$ {Number(acc.balance).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default AccountsSummary;
