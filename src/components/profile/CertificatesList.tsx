import { useNavigate } from "react-router-dom";
import { Award, ChevronRight } from "lucide-react";
import { useCertificates } from "@/hooks/useCertificates";

const CertificatesList = () => {
  const navigate = useNavigate();
  const { certificates, isLoading } = useCertificates();

  if (isLoading) return null;

  if (certificates.length === 0) {
    return (
      <button
        onClick={() => navigate("/perfil/certificados")}
        className="w-full glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:bg-primary/5 transition-colors"
      >
        <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center shrink-0">
          <Award size={18} className="text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Nenhum certificado ainda</p>
          <p className="text-xs text-muted-foreground">Conclua um mundo para ganhar o seu</p>
        </div>
        <ChevronRight size={16} className="text-muted-foreground" />
      </button>
    );
  }

  return (
    <div className="space-y-2">
      {certificates.slice(0, 3).map((c) => (
        <button
          key={c.id}
          onClick={() => navigate(`/perfil/certificados/${c.id}`)}
          className="w-full glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:bg-primary/5 transition-colors"
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-white"
            style={{ background: c.course_color || "#8A05BE" }}
          >
            <Award size={18} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{c.course_title ?? "Curso"}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(c.issued_at).toLocaleDateString("pt-BR")} · {c.code}
            </p>
          </div>
          <ChevronRight size={16} className="text-muted-foreground" />
        </button>
      ))}
      {certificates.length > 3 && (
        <button
          onClick={() => navigate("/perfil/certificados")}
          className="w-full text-xs text-primary text-center py-1 hover:underline"
        >
          Ver todos ({certificates.length})
        </button>
      )}
    </div>
  );
};

export default CertificatesList;
