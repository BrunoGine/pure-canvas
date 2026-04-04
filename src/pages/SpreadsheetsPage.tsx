import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Plus, Table2, Landmark, RefreshCw, Download, Loader2, BarChart3 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
        onError: (error: any) => {
          console.error("Pluggy Connect error:", error);
        },
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
      <Card className="shadow-card border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Landmark size={18} className="text-primary" />
              <h3 className="text-sm font-semibold">Open Finance</h3>
            </div>
            <div className="flex gap-2">
              {connections.length > 0 && (
                <Button variant="outline" size="sm" onClick={handleSyncAll} disabled={isLoading}>
                  {syncItem.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <RefreshCw size={14} className="mr-1" />}
                  Sincronizar
                </Button>
              )}
              <Button size="sm" onClick={handleConnectBank} disabled={isLoading} className="gradient-primary border-0 text-primary-foreground">
                {createToken.isPending ? <Loader2 size={14} className="animate-spin mr-1" /> : <Landmark size={14} className="mr-1" />}
                Conectar Banco
              </Button>
            </div>
          </div>
          {connections.length > 0 ? (
            <div className="space-y-2">
              {connections.map(conn => (
                <div key={conn.id} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-2">
                  <span className="font-medium">{conn.institution_name || "Banco"}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${conn.status === "UPDATED" || conn.status === "connected" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
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
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-bold text-primary">R$ {totalIncome.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-lg font-bold text-destructive">R$ {totalExpense.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="dashboard" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList>
            <TabsTrigger value="dashboard" className="gap-1">
              <BarChart3 size={14} /> Dashboard
            </TabsTrigger>
            <TabsTrigger value="transactions">Transações</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download size={14} className="mr-1" /> CSV
          </Button>
        </div>

        {/* Dashboard - Dynamic Spreadsheets */}
        <TabsContent value="dashboard" className="space-y-4">
          <AccountsSummary accounts={accounts} />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyOverview transactions={bankTransactions} />
            <CategoryBreakdown transactions={bankTransactions} />
          </div>
        </TabsContent>

        {/* All Transactions */}
        <TabsContent value="transactions">
          <TransactionTable
            manualTransactions={transactions}
            bankTransactions={bankTransactions}
            onRemoveManual={remove}
            showSource
          />
        </TabsContent>

        {/* Manual Entry */}
        <TabsContent value="manual" className="space-y-4">
          <Card className="shadow-card">
            <CardContent className="p-4 space-y-3">
              <h3 className="text-sm font-semibold">Nova Transação Manual</h3>
              <Input placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} />
              <Input placeholder="Valor" type="number" value={amount} onChange={e => setAmount(e.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Select value={type} onValueChange={(v: "income" | "expense") => setType(v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Receita</SelectItem>
                    <SelectItem value="expense">Despesa</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={addTransaction} className="w-full gradient-primary border-0 text-primary-foreground">
                <Plus size={16} className="mr-1" /> Adicionar
              </Button>
            </CardContent>
          </Card>
          <TransactionTable manualTransactions={transactions} onRemoveManual={remove} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpreadsheetsPage;
