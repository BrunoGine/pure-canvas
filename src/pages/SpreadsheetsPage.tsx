import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Table2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  const totalIncome = transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Table2 size={22} className="text-primary" /> Planilhas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas receitas e despesas</p>
      </motion.div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Receitas</p>
            <p className="text-lg font-bold text-primary">R$ {totalIncome.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Despesas</p>
            <p className="text-lg font-bold text-destructive">R$ {totalExpense.toLocaleString("pt-BR")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Form */}
      <Card className="shadow-card">
        <CardContent className="p-4 space-y-3">
          <h3 className="text-sm font-semibold">Nova Transação</h3>
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

      {/* Table */}
      <Card className="shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Descrição</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Categoria</th>
                <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Valor</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-muted-foreground w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {transactions.map(tx => (
                <tr key={tx.id} className="animate-fade-in">
                  <td className="px-4 py-3">
                    <p className="font-medium">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{tx.date}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{tx.category}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${tx.type === "income" ? "text-primary" : "text-destructive"}`}>
                    {tx.type === "income" ? "+" : "-"}R$ {tx.amount.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => remove(tx.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default SpreadsheetsPage;
