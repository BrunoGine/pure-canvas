import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Table2, Landmark, RefreshCw, Download, Loader2, BarChart3 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PluggyConnect } from "pluggy-connect-sdk";
import { useBankConnections, useBankAccounts, useBankTransactions, useCreateConnectToken, useSyncItem } from "@/hooks/useBankData";
import TransactionTable from "@/components/spreadsheets/TransactionTable";
import CategoryBreakdown from "@/components/spreadsheets/CategoryBreakdown";
import MonthlyOverview from "@/components/spreadsheets/MonthlyOverview";
import AccountsSummary from "@/components/spreadsheets/AccountsSummary";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

const categories = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Salário", "Freelance", "Outros"];

const SpreadsheetsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem("finapp-transactions");
    return saved ? JSON.parse(saved) : [
      { id: "1", description: "Salário", amount: 8500, type: "income", category: "Salário", date: "2026-03-28" },
      { id: "2", description: "Aluguel", amount: 1800, type: "expense", category: "Moradia", date: "2026-03-27" },
      { id: "3", description: "Supermercado", amount: 450, type: "expense", category: "Alimentação", date: "2026-03-26" },
    ];
  });

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Outros");

  const { data: connections = [] } = useBankConnections();
  const { data: accounts = [] } = useBankAccounts();
  const { data: bankTransactions = [] } = useBankTransactions();
  const createToken = useCreateConnectToken();
  const syncItem = useSyncItem();

  const handleConnectBank = useCallback(async () => {
    try {
      const connectToken = await createToken.mutateAsync();
      const pluggyConnect = new PluggyConnect({
        connectToken,
        onSuccess: async (data: { item: { id: string } }) => {
          await syncItem.mutateAsync(data.item.id);
        },
        onError: (error: any) => console.error("Pluggy Connect error:", error),
      });
      pluggyConnect.init();
    } catch (err) {
      console.error("Failed to open Pluggy Connect:", err);
    }
  }, [createToken, syncItem]);

  const handleSyncAll = useCallback(async () => {
    for (const conn of connections) {
      await syncItem.mutateAsync(conn.pluggy_item_id);
    }
  }, [connections, syncItem]);

  const save = (txs: Transaction[]) => {
    setTransactions(txs);
    localStorage.setItem("finapp-transactions", JSON.stringify(txs));
  };

  const addTransaction = () => {
    if (!desc || !amount) return;
    const tx: Transaction = {
      id: Date.now().toString(),
      description: desc,
      amount: parseFloat(amount),
      type,
      category,
      date: new Date().toISOString().split("T")[0],
    };
    save([tx, ...transactions]);
    setDesc("");
    setAmount("");
  };

  const remove = (id: string) => save(transactions.filter(t => t.id !== id));

  const manualIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const manualExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const bankIncome = bankTransactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const bankExpense = bankTransactions.filter(t => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalIncome = manualIncome + bankIncome;
  const totalExpense = manualExpense + bankExpense;

  const exportCSV = () => {
    const allTx = [
      ...transactions.map(t => ({ ...t, source: "Manual" })),
      ...bankTransactions.map(t => ({ ...t, source: "Banco" })),
    ];
    const header = "Descrição,Valor,Tipo,Categoria,Data,Origem\n";
    const rows = allTx.map(t =>
      `"${t.description}",${t.amount},${t.type},${t.category || ""},${t.date},${t.source}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isLoading = createToken.isPending || syncItem.isPending;

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Table2 size={22} className="text-primary" /> Planilhas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas finanças com dados do Open Finance</p>
      </motion.div>

      {/* Bank Connection */}
      <div className="glass-card rounded-xl p-4 glow-border">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Landmark size={16} className="text-primary" />
            </div>
            <h3 className="text-sm font-semibold">Open Finance</h3>
          </div>
          <div className="flex gap-2">
            {connections.length > 0 && (
              <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={isLoading} className="border-border/50 bg-secondary/30">
                {syncItem.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
                Sincronizar
              </Button>
            )}
            <Button size="sm" onClick={handleConnectBank} disabled={isLoading} className="gradient-primary border-0 text-white shadow-glow hover:shadow-elevated transition-all">
              {createToken.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Landmark size={14} className="mr-1" />}
              Conectar Banco
            </Button>
          </div>
        </div>
        {connections.length > 0 ? (
          <div className="space-y-2">
            {connections.map(conn => (
              <div key={conn.id} className="flex items-center justify-between text-sm bg-secondary/30 rounded-lg px-3 py-2 border border-border/30">
                <span className="font-medium">{conn.institution_name || "Banco"}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${conn.status === "UPDATED" || conn.status === "connected" ? "bg-primary/15 text-primary border border-primary/20" : "bg-secondary text-muted-foreground"}`}>
                  {conn.status === "UPDATED" || conn.status === "connected" ? "Conectado" : conn.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">
            Conecte sua conta bancária para gerar planilhas dinâmicas automaticamente via Open Finance.
          </p>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Receitas</p>
          <p className="text-lg font-bold text-primary mt-1 tabular-nums">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
        <div className="glass-card rounded-xl p-4 text-center">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Despesas</p>
          <p className="text-lg font-bold text-destructive mt-1 tabular-nums">R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
        </div>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="glass border border-border/30">
            <TabsTrigger value="dashboard" className="gap-1 data-[state=active]:shadow-glow">
              <BarChart3 size={14} /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions" className="data-[state=active]:shadow-glow">Transações</TabsTrigger>
            <TabsTrigger value="manual" className="data-[state=active]:shadow-glow">Manual</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-border/50 bg-secondary/30">
            <Download size={14} className="mr-1" /> CSV
          </Button>
        </div>

        <TabsContent value="dashboard" className="space-y-4">
          <AccountsSummary accounts={accounts} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyOverview transactions={bankTransactions} />
            <CategoryBreakdown transactions={bankTransactions} />
          </div>
        </TabsContent>

        <TabsContent value="transactions">
          <TransactionTable manualTransactions={transactions} bankTransactions={bankTransactions} onRemoveManual={remove} showSource />
        </TabsContent>

        <TabsContent value="manual" className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Nova Transação Manual</h3>
            <Input placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-glow transition-all" />
            <Input placeholder="Valor" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-glow transition-all" />
            <div className="grid grid-cols-2 gap-3">
              <Select value={type} onValueChange={(v: "income" | "expense") => setType(v)}>
                <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={addTransaction} className="w-full gradient-primary border-0 text-white shadow-glow hover:shadow-elevated transition-all">
              <Plus size={16} className="mr-1" /> Adicionar
            </Button>
          </div>
          <TransactionTable manualTransactions={transactions} onRemoveManual={remove} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpreadsheetsPage;
