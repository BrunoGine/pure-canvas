import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useAcceptCurrentLegal } from "@/hooks/useLegalAcceptance";
import LegalDocumentView from "@/components/legal/LegalDocumentView";
import type { LegalKind } from "@/hooks/useLegalDocuments";

const LegalAcceptPage = () => {
  const [accepted, setAccepted] = useState(false);
  const [openDoc, setOpenDoc] = useState<LegalKind | null>(null);
  const accept = useAcceptCurrentLegal();

  const handleAccept = () => {
    if (!accepted) return;
    accept.mutate(undefined, {
      onSuccess: () => {
        // Force a full reload so ProtectedRoutes re-evaluates the legal gate
        window.location.replace("/");
      },
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md glass-card rounded-2xl p-8 space-y-6"
      >
        <div className="flex flex-col items-center text-center gap-3">
          <div className="w-14 h-14 rounded-2xl gradient-primary flex items-center justify-center shadow-glow">
            <Shield className="text-white" size={26} />
          </div>
          <h1 className="font-display text-2xl font-bold">Atualizamos nossos termos</h1>
          <p className="text-sm text-muted-foreground">
            Revise e aceite a versão mais recente dos nossos Termos de Uso e da Política de Privacidade para continuar.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={() => setOpenDoc("terms")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors text-sm font-medium"
          >
            Ler Termos de Uso
            <ExternalLink size={14} />
          </button>
          <button
            onClick={() => setOpenDoc("privacy")}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-secondary/40 hover:bg-secondary transition-colors text-sm font-medium"
          >
            Ler Política de Privacidade
            <ExternalLink size={14} />
          </button>
        </div>

        <label className="flex items-start gap-3 cursor-pointer">
          <Checkbox
            checked={accepted}
            onCheckedChange={(v) => setAccepted(!!v)}
            className="mt-0.5"
          />
          <span className="text-sm text-muted-foreground leading-relaxed">
            Li e concordo com os Termos de Uso e a Política de Privacidade atualizados.
          </span>
        </label>

        <Button
          onClick={handleAccept}
          disabled={!accepted || accept.isPending}
          className="w-full h-11 gradient-primary border-0 text-white shadow-glow"
        >
          {accept.isPending ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            "Aceitar e continuar"
          )}
        </Button>
      </motion.div>

      <Dialog open={!!openDoc} onOpenChange={(o) => !o && setOpenDoc(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{openDoc === "terms" ? "Termos de Uso" : "Política de Privacidade"}</DialogTitle>
          </DialogHeader>
          {openDoc && <LegalDocumentView kind={openDoc} />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LegalAcceptPage;
