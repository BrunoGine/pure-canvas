import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Download, Loader2 } from "lucide-react";
import { useCertificate } from "@/hooks/useCertificates";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import CertificateView from "@/components/courses/CertificateView";
import { downloadCertificatePdf } from "@/lib/certificatePdf";

const CertificatePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: cert, isLoading } = useCertificate(id);
  const [name, setName] = useState("Aluno");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name || user.user_metadata?.display_name || "Aluno";
        setName(n);
      });
  }, [user]);

  const download = async () => {
    if (!ref.current || !cert) return;
    await downloadCertificatePdf(
      ref.current,
      `certificado-${(cert.course?.title ?? "curso").toLowerCase().replace(/\s+/g, "-")}.pdf`,
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  if (!cert) {
    return (
      <div className="space-y-4 pb-24">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary">
          <ChevronLeft size={20} />
        </button>
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Certificado não encontrado.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold truncate">Certificado</h1>
          <p className="text-xs text-muted-foreground truncate">{cert.course?.title}</p>
        </div>
      </div>

      <div className="rounded-2xl overflow-hidden border border-border/50 bg-white">
        <CertificateView
          ref={ref}
          studentName={name}
          courseTitle={cert.course?.title ?? "Curso"}
          code={cert.code}
          issuedAt={cert.issued_at}
          color={cert.course?.color}
        />
      </div>

      <button
        onClick={download}
        className="w-full py-3 rounded-xl gradient-primary text-white text-sm font-medium shadow-glow flex items-center justify-center gap-2"
      >
        <Download size={16} /> Baixar PDF
      </button>
    </div>
  );
};

export default CertificatePage;
