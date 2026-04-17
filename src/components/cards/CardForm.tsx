import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { BANKS, BRANDS, CARD_COLORS, getBank } from "./bankBrandData";
import CardVisual from "./CardVisual";
import { Plus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (card: { name: string; bank: string; brand: string; closing_day: number; color: string }) => void;
}

const CardForm = ({ open, onOpenChange, onSubmit }: Props) => {
  const [name, setName] = useState("");
  const [bank, setBank] = useState("nubank");
  const [brand, setBrand] = useState("mastercard");
  const [closingDay, setClosingDay] = useState("10");
  const [color, setColor] = useState(getBank("nubank").color);
  const [colorTouched, setColorTouched] = useState(false);

  useEffect(() => {
    if (!colorTouched) setColor(getBank(bank).color);
  }, [bank, colorTouched]);

  const reset = () => {
    setName("");
    setBank("nubank");
    setBrand("mastercard");
    setClosingDay("10");
    setColor(getBank("nubank").color);
    setColorTouched(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) return;
    const day = Math.min(31, Math.max(1, parseInt(closingDay) || 1));
    onSubmit({ name: name.trim(), bank, brand, closing_day: day, color });
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="glass-card border-border/30 max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Cartão</DialogTitle>
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
            <Plus size={16} className="mr-1" /> Adicionar cartão
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CardForm;
