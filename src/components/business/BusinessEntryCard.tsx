import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, ChevronRight, LogOut } from "lucide-react";
import { useCompany } from "@/contexts/CompanyContext";

const BusinessEntryCard = () => {
  const navigate = useNavigate();
  const { companies, mode, activeCompany, enterBusinessMode, exitBusinessMode, loading } = useCompany();

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

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18 }}>
      <button
        onClick={handleClick}
        className="w-full glass-card rounded-2xl p-4 flex items-center gap-3 hover:bg-primary/5 transition-colors text-left"
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
    </motion.div>
  );
};

export default BusinessEntryCard;
