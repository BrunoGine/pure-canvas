import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BANKS, BRANDS, CARD_COLORS, getBank } from "./bankBrandData";
import CardVisual from "./CardVisual";
import { Plus, Save } from "lucide-react";

export interface CardFormValues {
  name: string;
  bank: string;
  brand: string;
  closing_day: number;
  color: string;
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (card: CardFormValues) => void;
  initial?: CardFormValues | null;
}

const CardForm = ({ open, onOpenChange, onSubmit, initial }: Props) => {
  const isEdit = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [bank, setBank] = useState(initial?.bank ?? "nubank");
  const [brand, setBrand] = useState(initial?.brand ?? "mastercard");
  const [closingDay, setClosingDay] = useState(String(initial?.closing_day ?? 10));
  const [color, setColor] = useState(initial?.color ?? getBank("nubank").color);
  const [colorTouched, setColorTouched] = useState(!!initial);

  useEffect(() => {
    if (open) {
      setName(initial?.name ?? "");
      setBank(initial?.bank ?? "nubank");
      setBrand(initial?.brand ?? "mastercard");
      setClosingDay(String(initial?.closing_day ?? 10));
      setColor(initial?.color ?? getBank("nubank").color);
      setColorTouched(!!initial);
    }
  }, [open, initial]);

  useEffect(() => {
    if (!colorTouched) setColor(getBank(bank).color);
  }, [bank, colorTouched]);

  const handleSubmit = () => {
    if (!name.trim()) return;
    const day = Math.min(31, Math.max(1, parseInt(closingDay) || 1));
    onSubmit({ name: name.trim(), bank, brand, closing_day: day, color });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card border-border/30 max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Editar Cartão" : "Novo Cartão"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <CardVisual name={name} bank={bank} brand={brand} closingDay={parseInt(closingDay) || 1} color={color} />

          <div className="space-y-2">
            <Label className="text-xs">Nome do cartão</Label>
            <Input
              placeholder="Ex: Cartão principal"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-secondary/30 border-border/50"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label className="text-xs">Banco</Label>
              <Select value={bank} onValueChange={setBank}>
                <SelectTrigger className="bg-secondary/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BANKS.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Bandeira</Label>
              <Select value={brand} onValueChange={setBrand}>
                <SelectTrigger className="bg-secondary/30 border-border/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BRANDS.map((b) => (
                    <SelectItem key={b.slug} value={b.slug}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Dia de fechamento da fatura (1–31)</Label>
            <Input
              type="number"
              min={1}
              max={31}
              value={closingDay}
              onChange={(e) => setClosingDay(e.target.value)}
              className="bg-secondary/30 border-border/50"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Cor do cartão</Label>
            <div className="flex gap-2 flex-wrap">
              {CARD_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setColor(c); setColorTouched(true); }}
                  className={`w-8 h-8 rounded-full transition-all ${color === c ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-110" : ""}`}
                  style={{ background: c }}
                  aria-label={`Cor ${c}`}
                />
              ))}
            </div>
          </div>

          <Button onClick={handleSubmit} className="w-full gradient-primary border-0 text-white">
            {isEdit ? <Save size={16} className="mr-1" /> : <Plus size={16} className="mr-1" />}
            {isEdit ? "Salvar alterações" : "Adicionar cartão"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardForm;
