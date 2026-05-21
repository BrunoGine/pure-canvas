import { useState, useMemo, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, ArrowLeft, Trash2, CreditCard, Receipt, Pencil, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, Sector } from "recharts";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useCreditCards } from "@/hooks/useCreditCards";
import { Transaction } from "@/hooks/useTransactions";
import CardVisual from "./CardVisual";
import CardForm, { CardFormValues } from "./CardForm";
import TransactionTable from "@/components/spreadsheets/TransactionTable";
import { computeCardInvoices, formatBRL, formatDateShort } from "@/lib/invoice";

interface Props {
  transactions: Transaction[];
  onRemoveTransaction: (id: string) => void;
  onEditTransaction?: (tx: Transaction) => void;
  onPayInvoice?: (tx: Omit<Transaction, "id">) => Promise<unknown> | unknown;
}


const COLORS = ["#6366F1", "#EC4899", "#F59E0B", "#10B981", "#8B5CF6", "#06B6D4", "#F97316", "#14B8A6"];

const CardsTab = ({ transactions, onRemoveTransaction, onEditTransaction, onPayInvoice }: Props) => {
  const { cards, addCard, updateCard, removeCard } = useCreditCards();
  const [formOpen, setFormOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<CardFormValues | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [categoryMethodFilter, setCategoryMethodFilter] = useState<"all" | "credito" | "debito">("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [payOpen, setPayOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [payMethod, setPayMethod] = useState<"pix" | "debito" | "transferencia" | "dinheiro">("pix");
  const categoryCardRef = useRef<HTMLDivElement | null>(null);


  useEffect(() => {
    setSelectedCategory(null);
  }, [categoryMethodFilter, selectedId]);

  useEffect(() => {
    const handleDocMouseDown = (e: MouseEvent) => {
      if (!categoryCardRef.current) return;
      if (!categoryCardRef.current.contains(e.target as Node)) {
        setSelectedCategory(null);
      }
    };
    document.addEventListener("mousedown", handleDocMouseDown);
    return () => document.removeEventListener("mousedown", handleDocMouseDown);
  }, []);

  const toggleCategory = (name: string) => {
    setSelectedCategory(prev => (prev === name ? null : name));
  };

  const selected = cards.find((c) => c.id === selectedId);

  const cardTxs = useMemo(
    () => (selected ? transactions.filter((t) => (t as any).card_id === selected.id) : []),
    [transactions, selected]
  );

  const monthTotal = useMemo(() => {
    const now = new Date();
    return cardTxs
      .filter((t) => {
        const d = new Date(t.date);
        return t.type === "expense" && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      })
      .reduce((s, t) => s + Math.abs(t.amount), 0);
  }, [cardTxs]);

  const categoryData = useMemo(() => {
    const grouped: Record<string, number> = {};
    cardTxs
      .filter((t) => t.type === "expense")
      .filter((t) => categoryMethodFilter === "all" || (t as any).payment_method === categoryMethodFilter)
      .forEach((t) => {
        const cat = t.category || "Sem categoria";
        grouped[cat] = (grouped[cat] || 0) + Math.abs(t.amount);
      });
    return Object.entries(grouped)
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [cardTxs, categoryMethodFilter]);

  const invoices = useMemo(
    () => (selected ? computeCardInvoices(transactions, selected.id, selected.closing_day) : null),
    [transactions, selected]
  );

  const invoicePaidMarker = useMemo(() => {
    if (!selected || !invoices) return null;
    const cycleKey = invoices.cycles.currentCycleEnd.toISOString().slice(0, 10);
    return `card:${selected.id}|cycle:${cycleKey}`;
  }, [selected, invoices]);

  const isInvoicePaid = useMemo(() => {
    if (!invoicePaidMarker) return false;
    return transactions.some(
      (t) => t.category === "Pagamento de fatura" && (t.notes || "").includes(invoicePaidMarker)
    );
  }, [transactions, invoicePaidMarker]);


  if (selected) {
    return (
      <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => setSelectedId(null)} className="gap-1">
            <ArrowLeft size={16} /> Voltar
          </Button>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditingCardId(selected.id);
                setEditingCard({
                  name: selected.name,
                  bank: selected.bank,
                  brand: selected.brand,
                  closing_day: selected.closing_day,
                  color: selected.color,
                });
                setFormOpen(true);
              }}
              className="gap-1"
            >
              <Pencil size={14} /> Editar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm(`Remover cartão "${selected.name}"?`)) {
                  removeCard(selected.id);
                  setSelectedId(null);
                }
              }}
              className="text-destructive hover:text-destructive gap-1"
            >
              <Trash2 size={14} /> Remover
            </Button>
          </div>
        </div>

        <div className="max-w-sm mx-auto">
          <CardVisual
            name={selected.name}
            bank={selected.bank}
            brand={selected.brand}
            closingDay={selected.closing_day}
            color={selected.color}
          />
        </div>

        {invoices && (
          <Card className="shadow-card border-primary/20">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Receipt size={16} className="text-primary" />
                <h3 className="text-sm font-semibold">Faturas do cartão</h3>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl p-3 bg-primary/10 border border-primary/20 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                    Fatura atual
                  </p>
                  <p className="text-xl font-bold text-primary mt-1 tabular-nums truncate">
                    {formatBRL(invoices.current)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    {formatDateShort(invoices.cycles.currentCycleStart)} – {formatDateShort(invoices.cycles.currentCycleEnd)}
                  </p>
                </div>
                <div className="rounded-xl p-3 bg-secondary/40 border border-border/40 min-w-0">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground truncate">
                    Próxima fatura
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1 tabular-nums truncate">
                    {formatBRL(invoices.next)}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-1 truncate">
                    Fecha em {formatDateShort(invoices.cycles.nextCycleEnd)}
                  </p>
                </div>
              </div>

              {onPayInvoice && invoices.current > 0 && (
                isInvoicePaid ? (
                  <div className="w-full rounded-md border border-primary/30 bg-primary/10 text-primary text-sm font-medium py-2 text-center">
                    Fatura paga
                  </div>
                ) : (
                  <Button
                    onClick={() => setPayOpen(true)}
                    className="w-full gradient-primary border-0 text-white shadow-glow hover:shadow-elevated transition-all gap-1.5"
                    size="sm"
                  >
                    <Wallet size={14} /> Pagar fatura ({formatBRL(invoices.current)})
                  </Button>
                )
              )}

            </CardContent>
          </Card>
        )}


        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-xl p-4 text-center min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Gasto no mês</p>
            <p className="text-lg font-bold text-destructive mt-1 tabular-nums truncate">
              R$ {monthTotal.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="glass-card rounded-xl p-4 text-center min-w-0">
            <p className="text-xs text-muted-foreground uppercase tracking-wider truncate">Transações</p>
            <p className="text-lg font-bold text-primary mt-1 tabular-nums">{cardTxs.length}</p>
          </div>
        </div>

        {categoryData.length > 0 && (() => {
          const total = categoryData.reduce((s, d) => s + d.value, 0);
          const selectedIndex = selectedCategory ? categoryData.findIndex(d => d.name === selectedCategory) : -1;

          const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, payload }: any) => {
            if (percent < 0.01) return null;
            const sliceName = name || payload?.name;
            const handleLabelClick = (e: any) => {
              e.stopPropagation?.();
              if (sliceName) toggleCategory(sliceName);
            };
            const RADIAN = Math.PI / 180;
            if (percent < 0.03) {
              const radius = outerRadius + 12;
              const x = cx + radius * Math.cos(-midAngle * RADIAN);
              const y = cy + radius * Math.sin(-midAngle * RADIAN);
              return (
                <text
                  x={x}
                  y={y}
                  fill="hsl(var(--foreground))"
                  textAnchor={x > cx ? "start" : "end"}
                  dominantBaseline="central"
                  fontSize={10}
                  fontWeight={600}
                  onClick={handleLabelClick}
                  style={{ cursor: "pointer", pointerEvents: "all" }}
                >
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }
            const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
            const x = cx + radius * Math.cos(-midAngle * RADIAN);
            const y = cy + radius * Math.sin(-midAngle * RADIAN);
            return (
              <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={11}
                fontWeight={600}
                onClick={handleLabelClick}
                style={{ cursor: "pointer", pointerEvents: "all" }}
              >
                {`${(percent * 100).toFixed(0)}%`}
              </text>
            );
          };

          return (
            <Card ref={categoryCardRef} className="shadow-card">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-sm font-semibold">Gastos por categoria</h3>
                  <Select value={categoryMethodFilter} onValueChange={(v) => setCategoryMethodFilter(v as "all" | "credito" | "debito")}>
                    <SelectTrigger className="h-8 w-[110px] text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Ambos</SelectItem>
                      <SelectItem value="credito">Crédito</SelectItem>
                      <SelectItem value="debito">Débito</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="h-[220px] outline-none [&_*]:outline-none [&_path]:outline-none [&_path:focus]:outline-none">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        dataKey="value"
                        paddingAngle={2}
                        strokeWidth={0}
                        labelLine={false}
                        label={renderCustomLabel}
                        isAnimationActive={false}
                        className="cursor-pointer focus:outline-none"
                        activeIndex={selectedIndex >= 0 ? selectedIndex : undefined}
                        activeShape={(props: any) => (
                          <Sector {...props} outerRadius={props.outerRadius + 6} stroke="none" />
                        )}
                        onClick={(d: any) => {
                          if (d?.name) toggleCategory(d.name);
                        }}
                      >
                        {categoryData.map((entry, i) => {
                          const dimmed = selectedCategory && selectedCategory !== entry.name;
                          return (
                            <Cell
                              key={entry.name}
                              fill={COLORS[i % COLORS.length]}
                              fillOpacity={dimmed ? 0.35 : 1}
                              stroke="none"
                              style={{ outline: "none" }}
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        isAnimationActive={false}
                        formatter={(v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} iconType="circle" iconSize={8} onClick={() => {}} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 max-h-[200px] overflow-y-auto">
                  {categoryData.map((item, i) => {
                    const isSelected = selectedCategory === item.name;
                    const dimmed = selectedCategory && !isSelected;
                    return (
                      <button
                        key={item.name}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleCategory(item.name);
                        }}
                        className={`flex items-center justify-between text-sm w-full p-1.5 rounded-lg transition-all text-left ${
                          isSelected ? "bg-secondary ring-1 ring-primary/40" : "hover:bg-secondary/50"
                        } ${dimmed ? "opacity-50" : "opacity-100"}`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                          <span className="truncate">{item.name}</span>
                        </div>
                        <div className="text-right flex-shrink-0 ml-2">
                          <span className="font-semibold">R$ {item.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</span>
                          <span className="text-xs text-muted-foreground ml-1">({total > 0 ? ((item.value / total) * 100).toFixed(1) : 0}%)</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })()}

        <div>
          <h3 className="text-sm font-semibold mb-2">Transações deste cartão</h3>
          <TransactionTable manualTransactions={cardTxs} onRemoveManual={onRemoveTransaction} onEditManual={onEditTransaction ? (tx) => onEditTransaction(tx as Transaction) : undefined} />
        </div>

        <CardForm
          open={formOpen}
          onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingCard(null); setEditingCardId(null); } }}
          initial={editingCard}
          onSubmit={(values) => {
            if (editingCardId) updateCard(editingCardId, values);
            else addCard(values);
          }}
        />

        <AlertDialog open={payOpen} onOpenChange={(v) => !paying && setPayOpen(v)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Pagar fatura do {selected.name}</AlertDialogTitle>
              <AlertDialogDescription>
                Será registrada uma despesa de{" "}
                <strong className="text-foreground">{formatBRL(invoices?.current ?? 0)}</strong>{" "}
                como pagamento desta fatura. Escolha como o pagamento foi feito:
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="py-2">
              <Select value={payMethod} onValueChange={(v) => setPayMethod(v as typeof payMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pix">Pix</SelectItem>
                  <SelectItem value="debito">Débito</SelectItem>
                  <SelectItem value="transferencia">Transferência</SelectItem>
                  <SelectItem value="dinheiro">Dinheiro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={paying}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                disabled={paying || !onPayInvoice || !invoices?.current}
                onClick={async (e) => {
                  e.preventDefault();
                  if (!onPayInvoice || !invoices?.current) return;
                  try {
                    setPaying(true);
                    await onPayInvoice({
                      description: `Pagamento de fatura - ${selected.name}`,
                      amount: invoices.current,
                      type: "expense",
                      category: "Pagamento de fatura",
                      date: new Date().toISOString().slice(0, 10),
                      payment_method: payMethod,
                      card_id: null,
                      notes: invoicePaidMarker,
                    });

                    toast.success("Fatura paga com sucesso");
                    setPayOpen(false);
                  } catch (err) {
                    console.error(err);
                    toast.error("Não foi possível registrar o pagamento");
                  } finally {
                    setPaying(false);
                  }
                }}
              >
                {paying ? "Registrando..." : "Confirmar pagamento"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </motion.div>
    );
  }


  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <CreditCard size={16} className="text-primary" /> Meus cartões
        </h3>
        <Button onClick={() => { setEditingCard(null); setEditingCardId(null); setFormOpen(true); }} size="sm" className="gradient-primary border-0 text-white">
          <Plus size={14} className="mr-1" /> Adicionar
        </Button>
      </div>

      {cards.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-8 text-center text-muted-foreground text-sm space-y-2">
            <CreditCard size={32} className="mx-auto opacity-40" />
            <p>Nenhum cartão cadastrado.</p>
            <p className="text-xs">Adicione um cartão para acompanhar seus gastos.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {cards.map((c) => {
            const inv = computeCardInvoices(transactions, c.id, c.closing_day);
            return (
              <CardVisual
                key={c.id}
                name={c.name}
                bank={c.bank}
                brand={c.brand}
                closingDay={c.closing_day}
                color={c.color}
                invoiceAmount={inv.current}
                onClick={() => setSelectedId(c.id)}
              />
            );
          })}
        </div>
      )}

      <CardForm
        open={formOpen}
        onOpenChange={(v) => { setFormOpen(v); if (!v) { setEditingCard(null); setEditingCardId(null); } }}
        initial={editingCard}
        onSubmit={(values) => {
          if (editingCardId) updateCard(editingCardId, values);
          else addCard(values);
        }}
      />
    </div>
  );
};

export default CardsTab;
