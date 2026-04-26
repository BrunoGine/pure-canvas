import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Download, Share2, Loader2 } from "lucide-react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { useCertificates } from "@/hooks/useCertificates";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import CertificateView from "@/components/profile/CertificateView";

const CertificatePage = () => {
  const { certificateId } = useParams();
  const navigate = useNavigate();
  const { certificates, isLoading } = useCertificates();
  const { user } = useAuth();
  const { toast } = useToast();
  const [userName, setUserName] = useState("Aluno");
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setUserName(data?.display_name || user.user_metadata?.display_name || "Aluno");
      });
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  // Listagem
  if (!certificateId) {
    return (
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/perfil")} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold">Meus Certificados</h1>
        </div>

        {certificates.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Você ainda não tem certificados. Conclua um mundo inteiro para ganhar o seu.
          </div>
        ) : (
          <div className="space-y-3">
            {certificates.map((c) => (
              <button
                key={c.id}
                onClick={() => navigate(`/perfil/certificados/${c.id}`)}
                className="w-full text-left glass-card rounded-2xl p-4 hover:glow-border transition-all"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0"
                    style={{ background: c.course_color || "#8A05BE" }}
                  >
                    {c.course_title?.[0] ?? "C"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">{c.course_title ?? "Curso"}</p>
                    <p className="text-xs text-muted-foreground">
                      Emitido em {new Date(c.issued_at).toLocaleDateString("pt-BR")}
                    </p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{c.code}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  const cert = certificates.find((c) => c.id === certificateId);
  if (!cert) {
    return (
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/perfil/certificados")} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
            <ChevronLeft size={20} />
          </button>
          <h1 className="font-display text-xl font-bold">Certificado</h1>
        </div>
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Certificado não encontrado.
        </div>
      </div>
    );
  }

  const downloadPdf = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(certRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
      });
      const img = canvas.toDataURL("image/png");
      const pdf = new jsPDF({ orientation: "landscape", unit: "px", format: [canvas.width, canvas.height] });
      pdf.addImage(img, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`certificado-${cert.course_title?.replace(/\s+/g, "_") ?? "harp"}-${cert.code}.pdf`);
      toast({ title: "Baixado!", description: "Seu certificado foi salvo em PDF." });
    } catch (e) {
      toast({ title: "Erro", description: "Não foi possível gerar o PDF.", variant: "destructive" });
    } finally {
      setDownloading(false);
    }
  };

  const share = async () => {
    const text = `Concluí o mundo "${cert.course_title}" no Harp! 🏆 Código: ${cert.code}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Meu Certificado Harp", text });
      } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(text);
        toast({ title: "Copiado!", description: "Texto copiado para compartilhar." });
      } catch {}
    }
  };

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate("/perfil/certificados")} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <h1 className="font-display text-xl font-bold truncate">{cert.course_title}</h1>
      </div>

      <CertificateView
        ref={certRef}
        userName={userName}
        courseTitle={cert.course_title ?? "Curso"}
        courseColor={cert.course_color}
        issuedAt={cert.issued_at}
        code={cert.code}
      />

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={downloadPdf}
          disabled={downloading}
          className="py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
          Baixar PDF
        </button>
        <button
          onClick={share}
          className="py-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm flex items-center justify-center gap-2"
        >
          <Share2 size={16} /> Compartilhar
        </button>
      </div>
    </div>
  );
};

export default CertificatePage;
