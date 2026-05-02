import { useState } from "react";
import { Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onJoin: (code: string) => Promise<unknown>;
}

const JoinSharedGoalDialog = ({ open, onOpenChange, onJoin }: Props) => {
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    const r = await onJoin(code);
    setSubmitting(false);
    if (r) {
      setCode("");
      onOpenChange(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setCode("");
      }}
    >
      <DialogContent className="glass-card border-border/30">
        <DialogHeader>
          <DialogTitle>Entrar em vaquinha</DialogTitle>
          <DialogDescription>Digite o código de convite que você recebeu.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="join-code">Código</Label>
            <Input
              id="join-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABCD1234"
              maxLength={8}
              autoFocus
              className="bg-secondary/30 border-border/50 font-mono text-lg tracking-widest text-center uppercase"
            />
          </div>
          <Button onClick={submit} disabled={submitting || code.trim().length < 4} className="w-full gradient-primary text-white border-0">
            {submitting ? <Loader2 size={14} className="animate-spin mr-2" /> : null}
            Solicitar entrada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JoinSharedGoalDialog;
