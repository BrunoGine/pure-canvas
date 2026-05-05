import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, Save } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { paymentMethods } from "@/lib/paymentMethods";
import { useCreditCards } from "@/hooks/useCreditCards";

export interface EditableTransaction {
  description: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date?: string; // for normal
  day_of_month?: number; // for recurring
  notes?: string | null;
  card_id?: string | null;
  payment_method?: string | null;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initial: EditableTransaction | null;
  categories: string[];
  variant: "normal" | "recurring";
  onSave: (patch: EditableTransaction) => void;
}

const TransactionEditDialog = ({ open, onOpenChange, initial, categories, variant, onSave }: Props) => {
  const { cards } = useCreditCards();
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"income" | "expense">("expense");
  const [category, setCategory] = useState("Outros");
  const [date, setDate] = useState<Date>(new Date());
  const [day, setDay] = useState("1");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [cardId, setCardId] = useState("none");

  useEffect(() => {
    if (open && initial) {
      setDesc(initial.description);
      setAmount(String(initial.amount));
      setType(initial.type);
      setCategory(initial.category);
      if (initial.date) setDate(parseISO(initial.date));
      if (initial.day_of_month) setDay(String(initial.day_of_month));
      setNotes(initial.notes ?? "");
      setPaymentMethod(initial.payment_method ?? "pix");
      setCardId(initial.card_id ?? "none");
    }
  }, [open, initial]);

  const submit = () => {
    if (!desc.trim() || !amount) return;
    const patch: EditableTransaction = {
      description: desc.trim(),
      amount: parseFloat(amount),
      type,
      category,
      notes: notes.trim() || null,
      payment_method: paymentMethod,
      card_id: paymentMethod === "credito" || paymentMethod === "debito" ? (cardId !== "none" ? cardId : null) : null,
    };
    if (variant === "normal") {
      patch.date = format(date, "yyyy-MM-dd");
    } else {
      patch.day_of_month = Math.min(28, Math.max(1, parseInt(day) || 1));
    }
    onSave(patch);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{variant === "normal" ? "Editar Transação" : "Editar Recorrência"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Descrição" value={desc} onChange={(e) => setDesc(e.target.value)} className="bg-secondary/30 border-border/50" />
          <Input placeholder="Valor" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-secondary/30 border-border/50" />

          {variant === "normal" ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left font-normal bg-secondary/30 border-border/50")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(date, "dd/MM/yyyy", { locale: ptBR })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={date} onSelect={(d) => d && setDate(d)} className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
          ) : (
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Dia do mês (1-28)</Label>
              <Input type="number" min={1} max={28} value={day} onChange={(e) => setDay(e.target.value)} className="bg-secondary/30 border-border/50" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Select value={type} onValueChange={(v: "income" | "expense") => setType(v)}>
              <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Entrada</SelectItem>
                <SelectItem value="expense">Saída</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Input placeholder="Anotação (opcional)" value={notes} onChange={(e) => setNotes(e.target.value)} className="bg-secondary/30 border-border/50" />

          <Select value={paymentMethod} onValueChange={(v) => { setPaymentMethod(v); if (v !== "credito" && v !== "debito") setCardId("none"); }}>
            <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue placeholder="Método de pagamento" /></SelectTrigger>
            <SelectContent>
              {paymentMethods.map((p) => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
            </SelectContent>
          </Select>

          {(paymentMethod === "credito" || paymentMethod === "debito") && cards.length > 0 && (
            <Select value={cardId} onValueChange={setCardId}>
              <SelectTrigger className="bg-secondary/30 border-border/50"><SelectValue placeholder="Cartão (opcional)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sem cartão</SelectItem>
                {cards.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          )}

          <Button onClick={submit} className="w-full gradient-primary border-0 text-white">
            <Save size={16} className="mr-1" /> Salvar alterações
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionEditDialog;
