import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Award, ChevronRight } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";

const CertificatesList = () => {
  const navigate = useNavigate();
  const { data: certs = [], isLoading } = useCertificates();

  if (isLoading) {
    return <div className="text-sm text-muted-foreground py-4 text-center">Carregando certificados...</div>;
  }

  if (certs.length === 0) {
    return (
      <div className="glass-card rounded-2xl p-6 text-center">
        <Award size={28} className="mx-auto text-muted-foreground mb-2" />
        <p className="text-sm font-medium">Nenhum certificado ainda</p>
        <p className="text-xs text-muted-foreground mt-1">
          Conclua um mundo inteiro para receber seu primeiro certificado.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {certs.map((c, i) => {
        const color = c.course?.color ?? "hsl(var(--primary))";
        return (
          <motion.button
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/cursos/certificado/${c.id}`)}
            className="w-full text-left rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all"
            style={{
              background: `linear-gradient(135deg, ${color}1a, ${color}05, hsl(var(--card)))`,
              border: `1px solid ${color}33`,
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 6px 18px -8px ${color}aa` }}
            >
              <Award size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{c.course?.title ?? "Mundo"}</p>
              <p className="text-[11px] text-muted-foreground">
                Emitido em {new Date(c.issued_at).toLocaleDateString("pt-BR")} · Código {c.code}
              </p>
            </div>
            <ChevronRight size={16} className="text-muted-foreground shrink-0" />
          </motion.button>
        );
      })}
    </div>
  );
};

export default CertificatesList;
