import { motion } from "framer-motion";
import { Building2, X } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

const BusinessModeBanner = () => {
  const { mode, activeCompany, exitBusinessMode } = useCompany();

  if (mode !== "business" || !activeCompany) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-40 w-full"
    >
      <div className="mx-auto max-w-lg px-4 pt-2">
        <div className="flex items-center justify-between gap-3 rounded-xl border border-primary/30 bg-primary/10 backdrop-blur-md px-3 py-2 shadow-card">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
              <Building2 size={14} className="text-primary" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground leading-none">
                Modo Empresa
              </p>
              <p className="text-sm font-semibold truncate">{activeCompany.name}</p>
            </div>
          </div>
          <button
            onClick={() => exitBusinessMode()}
            className="flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground rounded-lg px-2 py-1 hover:bg-secondary/60 transition-colors"
            aria-label="Voltar ao modo pessoal"
          >
            <X size={14} /> Sair
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default BusinessModeBanner;
