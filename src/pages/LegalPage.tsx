import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import LegalDocumentView from "@/components/legal/LegalDocumentView";

const LegalPage = () => {
  const navigate = useNavigate();
  const { kind } = useParams<{ kind: "termos" | "privacidade" }>();
  const docKind = kind === "termos" ? "terms" : "privacy";
  const title = kind === "termos" ? "Termos de Uso" : "Política de Privacidade";

  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-2 -ml-2 rounded-xl hover:bg-secondary transition-colors"
          aria-label="Voltar"
        >
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-2xl font-bold">{title}</h1>
      </motion.div>
      <div className="glass-card rounded-2xl p-6">
        <LegalDocumentView kind={docKind} />
      </div>
    </div>
  );
};

export default LegalPage;
