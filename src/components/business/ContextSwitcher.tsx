import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, User, ChevronDown, Plus, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCompany } from "@/contexts/CompanyContext";

const ContextSwitcher = () => {
  const navigate = useNavigate();
  const { mode, companies, activeCompany, enterBusinessMode, exitBusinessMode, loading } = useCompany();
  const [open, setOpen] = useState(false);

  if (loading) return null;

  const isBusiness = mode === "business" && !!activeCompany;
  const label = isBusiness ? activeCompany!.name : "Pessoal";
  const Icon = isBusiness ? Building2 : User;

  const handlePersonal = async () => {
    await exitBusinessMode();
    setOpen(false);
    navigate("/");
  };

  const handleCompany = async (id: string) => {
    await enterBusinessMode(id);
    setOpen(false);
    navigate("/empresa");
  };

  const handleCreate = () => {
    setOpen(false);
    navigate("/empresa/onboarding");
  };

  return (
    <div className="relative w-full flex justify-center">
      <button
        onClick={() => setOpen((v) => !v)}
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          isBusiness
            ? "bg-[hsl(var(--business-primary)/0.15)] border-[hsl(var(--business-primary)/0.4)] text-[hsl(var(--business-primary))]"
            : "bg-secondary/60 border-border/60 text-foreground hover:bg-secondary"
        }`}
      >
        <Icon size={14} />
        <span className="max-w-[180px] truncate">{label}</span>
        <ChevronDown size={12} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -4, scale: 0.98 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full mt-2 left-1/2 -translate-x-1/2 z-50 w-64 glass-card rounded-xl p-1.5 shadow-elevated"
            >
              <button
                onClick={handlePersonal}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <User size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">Pessoal</p>
                  <p className="text-[10px] text-muted-foreground">Suas finanças</p>
                </div>
                {!isBusiness && <Check size={14} className="text-primary" />}
              </button>

              {companies.map((c) => {
                const active = isBusiness && activeCompany?.id === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => handleCompany(c.id)}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[hsl(var(--business-primary)/0.15)] flex items-center justify-center text-[hsl(var(--business-primary))]">
                      <Building2 size={14} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold truncate">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {c.segment || c.business_type || "Empresa"}
                      </p>
                    </div>
                    {active && <Check size={14} className="text-[hsl(var(--business-primary))]" />}
                  </button>
                );
              })}

              <div className="my-1 h-px bg-border/40" />

              <button
                onClick={handleCreate}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-primary/10 transition-colors text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                  <Plus size={14} />
                </div>
                <p className="text-xs font-semibold">
                  {companies.length === 0 ? "Criar minha empresa" : "Nova empresa"}
                </p>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ContextSwitcher;
