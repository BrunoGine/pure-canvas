import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { Plus, Table2, Download, BarChart3, Trash2, Filter, CalendarIcon, Repeat, Power } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import TransactionTable from "@/components/spreadsheets/TransactionTable";
import CategoryBreakdown from "@/components/spreadsheets/CategoryBreakdown";
import MonthlyOverview from "@/components/spreadsheets/MonthlyOverview";
import CategoryBudget from "@/components/spreadsheets/CategoryBudget";
import CategorySummaryCards from "@/components/spreadsheets/CategorySummaryCards";
import CategorySpendingDialog from "@/components/spreadsheets/CategorySpendingDialog";
import { useTransactions } from "@/hooks/useTransactions";
import { useRecurringTransactions } from "@/hooks/useRecurringTransactions";

const defaultCategories = ["Alimentação", "Transporte", "Moradia", "Lazer", "Saúde", "Educação", "Salário", "Freelance", "Outros"];

const SpreadsheetsPage = () => {
  const { transactions, loading, addTransaction: addTx, removeTransaction: removeTx } = useTransactions();
  const { recurringTransactions, addRecurring, removeRecurring, toggleRecurring } = useRecurringTransactions();

  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [date, setDate] = useState<Date>(new Date());
  const [category, setCategory] = useState("Outros");
  const [notes, setNotes] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [customCategories, setCustomCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem("finapp-custom-categories");
    return saved ? JSON.parse(saved) : [];
  });
  const [removedDefaults, setRemovedDefaults] = useState<string[]>(() => {
    const saved = localStorage.getItem("finapp-removed-categories");
    return saved ? JSON.parse(saved) : [];
  });
  const [budgets, setBudgets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem("finapp-budgets");
    return saved ? JSON.parse(saved) : {};
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [removeCategoryDialogOpen, setRemoveCategoryDialogOpen] = useState(false);
  const [spendingDialogOpen, setSpendingDialogOpen] = useState(false);
  const [recurringDialogOpen, setRecurringDialogOpen] = useState(false);
  const [recDesc, setRecDesc] = useState("");
  const [recAmount, setRecAmount] = useState("");
  const [recType, setRecType] = useState<"income" | "expense">("expense");
  const [recCategory, setRecCategory] = useState("Outros");
  const [recDay, setRecDay] = useState("1");
  const [recNotes, setRecNotes] = useState("");

  const categories = [...defaultCategories.filter(c => c !== "Outros" && !removedDefaults.includes(c)), ...customCategories, "Outros"];

  // Filter
  const filteredTransactions = selectedCategory
    ? transactions.filter(t => t.category === selectedCategory)
    : transactions;

  const usedCategories = [...new Set(transactions.map(t => t.category))];

  const addCategory = () => {
    const trimmed = newCategoryName.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    const updated = [...customCategories, trimmed];
    setCustomCategories(updated);
    localStorage.setItem("finapp-custom-categories", JSON.stringify(updated));
    setCategory(trimmed);
    setNewCategoryName("");
    setCategoryDialogOpen(false);
  };

  const removeCategory = (cat: string) => {
    if (cat === "Outros") return;
    if (customCategories.includes(cat)) {
      const updated = customCategories.filter(c => c !== cat);
      setCustomCategories(updated);
      localStorage.setItem("finapp-custom-categories", JSON.stringify(updated));
    } else {
      const updated = [...removedDefaults, cat];
      setRemovedDefaults(updated);
      localStorage.setItem("finapp-removed-categories", JSON.stringify(updated));
    }
    if (category === cat) setCategory("Outros");
    if (selectedCategory === cat) setSelectedCategory(null);
  };

  const updateBudgets = (b: Record<string, number>) => {
    setBudgets(b);
    localStorage.setItem("finapp-budgets", JSON.stringify(b));
  };

  const addTransaction = () => {
    if (!desc || !amount) return;
    addTx({
      description: desc,
      amount: parseFloat(amount),
      type,
      category,
      date: format(date, "yyyy-MM-dd"),
      notes: notes.trim() || null,
    });
    setDesc("");
    setAmount("");
    setDate(new Date());
    setNotes("");
  };

  const remove = (id: string) => removeTx(id);

  const totalIncome = filteredTransactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = filteredTransactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const exportCSV = () => {
    const header = "Descrição,Valor,Tipo,Categoria,Data\n";
    const rows = filteredTransactions.map(t =>
      `"${t.description}",${t.amount},${t.type},${t.category},${t.date}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transacoes_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const txForCharts = transactions.map(t => ({
    id: t.id, description: t.description, amount: t.amount, date: t.date, category: t.category, type: t.type,
  }));

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <Table2 size={22} className="text-primary" /> Planilhas
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Gerencie suas finanças manualmente</p>
      </motion.div>

      {/* Category Filter Chips */}
      {usedCategories.length > 0 && (
        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground flex-shrink-0" />
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-1.5 pb-1">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  selectedCategory === null
                    ? "gradient-primary text-white shadow-glow"
                    : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/30"
                }`}
              >
                Todas
              </button>
              {usedCategories.map(cat => {
                const isOver = budgets[cat] && transactions
                  .filter(t => {
                    const d = new Date(t.date);
                    const now = new Date();
                    return t.type === "expense" && t.category === cat && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                  })
                  .reduce((s, t) => s + Math.abs(t.amount), 0) > budgets[cat];

                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all relative ${
                      selectedCategory === cat
                        ? "gradient-primary text-white shadow-glow"
                        : "bg-secondary/50 text-muted-foreground hover:bg-secondary border border-border/30"
                    }`}
                  >
                    {cat}
                    {isOver && (
                      <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-destructive rounded-full border-2 border-background animate-pulse" />
                    )}
                  </button>
                );
              })}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      {/* Summary Cards for selected category */}
      {selectedCategory && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <CategorySummaryCards transactions={txForCharts} selectedCategory={selectedCategory} />
        </motion.div>
      )}

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
      <Tabs defaultValue="transactions" className="w-full">
        <div className="flex items-center justify-between mb-2">
          <TabsList className="glass border border-border/30">
            <TabsTrigger value="transactions" className="data-[state=active]:shadow-glow">Transações</TabsTrigger>
            <TabsTrigger value="dashboard" className="gap-1 data-[state=active]:shadow-glow">
              <BarChart3 size={14} /> Dashboard
            </TabsTrigger>
          </TabsList>
          <Button variant="outline" size="sm" onClick={exportCSV} className="border-border/50 bg-secondary/30">
            <Download size={14} className="mr-1" /> CSV
          </Button>
        </div>

        <TabsContent value="transactions" className="space-y-4">
          <div className="glass-card rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold">Nova Transação</h3>
            <Input placeholder="Descrição" value={desc} onChange={e => setDesc(e.target.value)} className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-glow transition-all" />
            <Input placeholder="Valor" type="number" value={amount} onChange={e => setAmount(e.target.value)} className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-glow transition-all" />
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary/30 border-border/50", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy", { locale: ptBR }) : "Selecionar data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={(d) => d && setDate(d)}
                  disabled={(d) => d > new Date()}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
            <div className="grid grid-cols-2 gap-3">
              <Select value={type} onValueChange={(v: "income" | "expense") => setType(v)}>
                <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Receita</SelectItem>
                  <SelectItem value="expense">Despesa</SelectItem>
                </SelectContent>
              </Select>
              <Select value={category} onValueChange={(v) => {
                if (v === "__create__") setCategoryDialogOpen(true);
                else if (v === "__remove__") setRemoveCategoryDialogOpen(true);
                else setCategory(v);
              }}>
                <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.map(c => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                  <SelectItem value="__create__" className="text-primary font-medium">
                    <span className="flex items-center gap-1"><Plus size={14} /> Criar categoria</span>
                  </SelectItem>
                  <SelectItem value="__remove__" className="text-destructive font-medium">
                    <span className="flex items-center gap-1"><Trash2 size={14} /> Remover categoria</span>
                  </SelectItem>
                </SelectContent>
              </Select>

              <Dialog open={categoryDialogOpen} onOpenChange={setCategoryDialogOpen}>
                <DialogContent className="glass-card border-border/30">
                  <DialogHeader><DialogTitle>Nova Categoria</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Nome da categoria" value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} onKeyDown={e => e.key === "Enter" && addCategory()} className="bg-secondary/30 border-border/50" />
                    <Button onClick={addCategory} className="w-full gradient-primary border-0 text-white"><Plus size={16} className="mr-1" /> Criar</Button>
                  </div>
                </DialogContent>
              </Dialog>

              <Dialog open={removeCategoryDialogOpen} onOpenChange={setRemoveCategoryDialogOpen}>
                <DialogContent className="glass-card border-border/30">
                  <DialogHeader><DialogTitle>Remover Categoria</DialogTitle></DialogHeader>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {categories.filter(c => c !== "Outros").map(c => (
                      <div key={c} className="flex items-center justify-between p-2 rounded-lg bg-secondary/20 border border-border/30">
                        <span className="text-sm">{c}</span>
                        <Button variant="ghost" size="sm" onClick={() => removeCategory(c)} className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2">
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    ))}
                    {categories.filter(c => c !== "Outros").length === 0 && (
                      <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria para remover.</p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
            </div>
            <Input placeholder="Anotação (opcional)" value={notes} onChange={e => setNotes(e.target.value)} className="bg-secondary/30 border-border/50 focus:border-primary/50 focus:shadow-glow transition-all" />
            <Button onClick={addTransaction} className="w-full gradient-primary border-0 text-white shadow-glow hover:shadow-elevated transition-all">
              <Plus size={16} className="mr-1" /> Adicionar
            </Button>
            <Button variant="outline" onClick={() => setRecurringDialogOpen(true)} className="w-full border-border/50 bg-secondary/30">
              <Repeat size={16} className="mr-1" /> Transação Recorrente
            </Button>
          </div>

          {/* Recurring Transactions List */}
          {recurringTransactions.length > 0 && (
            <div className="glass-card rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Repeat size={14} className="text-primary" /> Transações Recorrentes
              </h3>
              <div className="space-y-2">
                {recurringTransactions.map((rec) => (
                  <div key={rec.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-border/30">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{rec.description}</p>
                      <p className="text-xs text-muted-foreground">
                        R$ {rec.amount.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · Dia {rec.day_of_month} · {rec.type === "income" ? "Receita" : "Despesa"} · {rec.category}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Switch checked={rec.active} onCheckedChange={(v) => toggleRecurring(rec.id, v)} />
                      <Button variant="ghost" size="icon" onClick={() => removeRecurring(rec.id)} className="text-destructive hover:text-destructive h-8 w-8">
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recurring Transaction Dialog */}
          <Dialog open={recurringDialogOpen} onOpenChange={setRecurringDialogOpen}>
            <DialogContent className="glass-card border-border/30">
              <DialogHeader><DialogTitle>Nova Transação Recorrente</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input placeholder="Descrição" value={recDesc} onChange={e => setRecDesc(e.target.value)} className="bg-secondary/30 border-border/50" />
                <Input placeholder="Valor" type="number" value={recAmount} onChange={e => setRecAmount(e.target.value)} className="bg-secondary/30 border-border/50" />
                <div className="grid grid-cols-2 gap-3">
                  <Select value={recType} onValueChange={(v: "income" | "expense") => setRecType(v)}>
                    <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Receita</SelectItem>
                      <SelectItem value="expense">Despesa</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={recCategory} onValueChange={setRecCategory}>
                    <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Dia do mês para executar (1-28)</label>
                  <Input
                    type="number"
                    min={1}
                    max={28}
                    value={recDay}
                    onChange={e => setRecDay(e.target.value)}
                    className="bg-secondary/30 border-border/50"
                  />
                </div>
                <Input placeholder="Anotação (opcional)" value={recNotes} onChange={e => setRecNotes(e.target.value)} className="bg-secondary/30 border-border/50" />
                <Button
                  onClick={() => {
                    if (!recDesc || !recAmount || !recDay) return;
                    const day = Math.min(28, Math.max(1, parseInt(recDay)));
                    addRecurring({
                      description: recDesc,
                      amount: parseFloat(recAmount),
                      type: recType,
                      category: recCategory,
                      notes: recNotes.trim() || null,
                      day_of_month: day,
                    });
                    setRecDesc("");
                    setRecAmount("");
                    setRecDay("1");
                    setRecNotes("");
                    setRecurringDialogOpen(false);
                  }}
                  className="w-full gradient-primary border-0 text-white"
                >
                  <Repeat size={16} className="mr-1" /> Criar Recorrência
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <TransactionTable manualTransactions={filteredTransactions} onRemoveManual={remove} />
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-4">
          <Button onClick={() => setSpendingDialogOpen(true)} className="w-full gradient-primary border-0 text-white shadow-glow hover:shadow-elevated transition-all">
            <BarChart3 size={16} className="mr-2" /> Categoria do gasto
          </Button>
          <CategorySpendingDialog
            open={spendingDialogOpen}
            onOpenChange={setSpendingDialogOpen}
            transactions={txForCharts}
            categories={categories}
          />
          <CategoryBudget
            transactions={txForCharts}
            categories={categories.filter(c => c !== "Outros")}
            budgets={budgets}
            onUpdateBudgets={updateBudgets}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <MonthlyOverview transactions={txForCharts} />
            <CategoryBreakdown transactions={txForCharts} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SpreadsheetsPage;
