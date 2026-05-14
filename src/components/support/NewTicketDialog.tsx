import { useState } from "react";
import { Sparkles, Send } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSupportTickets, type TicketCategory } from "@/hooks/useSupportTickets";

const CATEGORIES: { value: TicketCategory; label: string }[] = [
  { value: "technical", label: "Problema técnico" },
  { value: "financial", label: "Financeiro" },
  { value: "account", label: "Conta" },
  { value: "company", label: "Empresa" },
  { value: "harp", label: "Harp.IA" },
  { value: "suggestion", label: "Sugestão" },
  { value: "other", label: "Outro" },
];

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated?: (ticketId: string) => void;
}

export const NewTicketDialog = ({ open, onOpenChange, onCreated }: Props) => {
  const { toast } = useToast();
  const { createTicket } = useSupportTickets();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory>("technical");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [harpAnswer, setHarpAnswer] = useState<string | null>(null);
  const [askingHarp, setAskingHarp] = useState(false);

  const reset = () => {
    setSubject(""); setCategory("technical"); setMessage("");
    setHarpAnswer(null); setSubmitting(false); setAskingHarp(false);
  };

  const tryHarp = async () => {
    if (!message.trim()) {
      toast({ title: "Descreva seu problema primeiro", variant: "destructive" });
      return;
    }
    setAskingHarp(true);
    setHarpAnswer(null);
    try {
      const { data, error } = await supabase.functions.invoke("harp-ia-chat", {
        body: {
          messages: [
            { role: "system", content: "Você é a Harp.IA, assistente de suporte. Tente responder de forma clara e útil em até 4 frases. Se não souber resolver, indique que o usuário pode abrir um ticket." },
            { role: "user", content: message.trim() },
          ],
        },
      });
      if (error) throw error;
      const reply = data?.reply || data?.content || data?.message || "Não consegui responder agora. Você pode abrir um ticket.";
      setHarpAnswer(reply);
    } catch {
      setHarpAnswer("Não consegui responder agora. Você pode abrir um ticket.");
    } finally {
      setAskingHarp(false);
    }
  };

  const submit = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: "Preencha assunto e descrição", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const t = await createTicket({ subject: subject.trim(), category, message: message.trim() });
      toast({ title: "Ticket criado!", description: "Nossa equipe responderá em breve." });
      reset();
      onOpenChange(false);
      onCreated?.(t.id);
    } catch (e: any) {
      toast({ title: "Erro", description: e?.message || "Não foi possível criar o ticket", variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Abrir chamado</DialogTitle>
          <DialogDescription>Conte o que aconteceu. Tentaremos resolver o mais rápido possível.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Assunto</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Resumo curto" maxLength={120} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as TicketCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Descrição</Label>
            <Textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="Descreva o problema, o que tentou, prints, etc." maxLength={2000} />
          </div>

          <div className="rounded-xl border border-primary/20 bg-primary/5 p-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles size={16} className="text-primary" />
                Tentar resolver com a Harp
              </div>
              <Button size="sm" variant="outline" onClick={tryHarp} disabled={askingHarp || !message.trim()}>
                {askingHarp ? "Consultando..." : "Consultar"}
              </Button>
            </div>
            {harpAnswer && (
              <div className="text-sm text-foreground/90 whitespace-pre-wrap bg-card/60 rounded-lg p-2 border border-border/40">
                {harpAnswer}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={submitting}>
            <Send size={14} /> {submitting ? "Enviando..." : "Abrir ticket"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
