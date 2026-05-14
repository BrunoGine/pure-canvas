import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ChevronRight, LogOut, Trash2 } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";
import { useToast } from "@/hooks/use-toast";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const BusinessEntryCard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { companies, mode, activeCompany, enterBusinessMode, exitBusinessMode, deleteCompany, loading } = useCompany();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [targetId, setTargetId] = useState<string>("");
  const [deleting, setDeleting] = useState(false);

  const hasCompany = companies.length > 0;
  const isBusiness = mode === "business" && activeCompany;

  const handleClick = async () => {
    if (loading) return;
    if (!hasCompany) {
      navigate("/empresa/onboarding");
      return;
    }
    if (isBusiness) {
      await exitBusinessMode();
      return;
    }
    await enterBusinessMode(companies[0].id);
    navigate("/", { replace: true });
  };

  const openConfirm = () => {
    const initial = activeCompany?.id || companies[0]?.id || "";
    setTargetId(initial);
    setConfirmOpen(true);
  };

  const target = companies.find((c) => c.id === targetId);

  const handleDelete = async () => {
    if (!targetId) return;
    setDeleting(true);
    try {
      await deleteCompany(targetId);
      toast({ title: "Empresa excluída", description: "Todos os dados vinculados foram removidos." });
      setConfirmOpen(false);
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Não foi possível excluir a empresa.", variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
      <div className="glass-card rounded-2xl flex items-center">
        <button
          onClick={handleClick}
          className="flex-1 p-4 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left rounded-2xl"
        >
          <div className="w-11 h-11 rounded-xl gradient-primary flex items-center justify-center text-white shadow-glow">
            <Building2 size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">
              {isBusiness ? "Gerenciar empresa" : hasCompany ? "Minha Empresa" : "Configurar empresa"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {isBusiness
                ? `Editar dados de ${activeCompany?.name}`
                : hasCompany
                  ? `Acessar ${companies[0].name}`
                  : "Crie seu ambiente empresarial"}
            </p>
          </div>
          {isBusiness ? (
            <LogOut size={16} className="text-muted-foreground" />
          ) : (
            <ChevronRight size={16} className="text-muted-foreground" />
          )}
        </button>
        {hasCompany && (
          <button
            onClick={openConfirm}
            aria-label="Excluir empresa"
            className="p-3 mr-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação é <strong>permanente</strong>. Todos os dados vinculados a{" "}
              <strong>{target?.name || "esta empresa"}</strong> serão perdidos, incluindo transações,
              orçamentos, cartões, lançamentos recorrentes e metas associadas. Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {companies.length > 1 && (
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">Empresa a excluir</label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); handleDelete(); }}
              disabled={deleting || !targetId}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Excluindo..." : "Excluir definitivamente"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default BusinessEntryCard;
