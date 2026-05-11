import { useState, useMemo } from "react";
import { FileText, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCompany } from "@/contexts/CompanyContext";
import { buildBalanceSheet, formatBRL } from "@/lib/balanceSheet";
import { downloadBalanceSheetPdf } from "@/lib/balanceSheetPdf";
import { toast } from "sonner";

interface BalanceSheetCardProps {
  transactions: Array<{ amount: number; type: "income" | "expense"; category: string; date: string }>;
}

const BalanceSheetCard = ({ transactions }: BalanceSheetCardProps) => {
  const { activeCompany } = useCompany();
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [generating, setGenerating] = useState(false);

  const years = useMemo(() => {
    const set = new Set<number>([new Date().getFullYear()]);
    transactions.forEach((t) => set.add(new Date(t.date).getFullYear()));
    return [...set].sort((a, b) => b - a);
  }, [transactions]);

  const bs = useMemo(
    () =>
      buildBalanceSheet(
        transactions.map((t) => ({ amount: t.amount, type: t.type, category: t.category, date: t.date })),
        year,
      ),
    [transactions, year],
  );

  if (!activeCompany) return null;

  const handleDownload = async () => {
    setGenerating(true);
    try {
      downloadBalanceSheetPdf(bs, activeCompany.name);
      toast.success("Balanço gerado!");
    } catch (e: any) {
      toast.error("Erro ao gerar PDF");
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="w-full glass-card rounded-xl p-4 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left">
          <div className="w-10 h-10 rounded-xl bg-primary/15 border border-primary/20 flex items-center justify-center text-primary">
            <FileText size={18} />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">📑 Gerar Balanço Patrimonial</p>
            <p className="text-xs text-muted-foreground">
              Relatório anual baseado nas suas transações empresariais
            </p>
          </div>
        </button>
      </DialogTrigger>
      <DialogContent className="glass-card border-border/30 max-h-[90vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle>Balanço Patrimonial — {activeCompany.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground">Exercício</label>
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="bg-secondary/30 border-border/50 mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3 text-sm">
            <Row label="Receita Bruta" value={formatBRL(bs.totalRevenue)} />
            <Row label="Despesas Totais" value={formatBRL(bs.totalExpenses)} />
            <Row
              label={bs.result >= 0 ? "Lucro do Exercício" : "Prejuízo do Exercício"}
              value={formatBRL(bs.result)}
              accent={bs.result >= 0 ? "primary" : "destructive"}
            />
            <div className="h-px bg-border/50 my-2" />
            <Row label="Total do Ativo" value={formatBRL(bs.totals.ativo)} bold />
            <Row label="Total do Passivo" value={formatBRL(bs.totals.passivo)} bold />
            <Row label="Patrimônio Líquido" value={formatBRL(bs.totals.patrimonio)} bold accent="primary" />
          </div>

          <p className="text-[11px] text-muted-foreground">
            Este relatório é gerado automaticamente e não substitui a análise de um contador habilitado.
          </p>

          <Button
            onClick={handleDownload}
            disabled={generating}
            className="w-full gradient-primary border-0 text-white"
          >
            {generating ? <Loader2 className="animate-spin" size={16} /> : <Download size={16} />}
            Baixar PDF
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const Row = ({ label, value, bold, accent }: { label: string; value: string; bold?: boolean; accent?: "primary" | "destructive" }) => (
  <div className="flex items-center justify-between">
    <span className={`${bold ? "font-semibold" : "text-muted-foreground"}`}>{label}</span>
    <span
      className={`tabular-nums ${bold ? "font-bold" : "font-medium"} ${
        accent === "primary" ? "text-primary" : accent === "destructive" ? "text-destructive" : ""
      }`}
    >
      {value}
    </span>
  </div>
);

export default BalanceSheetCard;
