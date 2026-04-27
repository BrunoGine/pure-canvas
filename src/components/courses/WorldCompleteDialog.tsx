import { useRef } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Download, Eye, PartyPopper } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import CertificateView from "./CertificateView";
import { downloadCertificatePdf } from "@/lib/certificatePdf";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  certificateId: string;
  studentName: string;
  courseTitle: string;
  code: string;
  issuedAt: string;
  color?: string;
}

const WorldCompleteDialog = ({
  open,
  onOpenChange,
  certificateId,
  studentName,
  courseTitle,
  code,
  issuedAt,
  color,
}: Props) => {
  const navigate = useNavigate();
  const certRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!certRef.current) return;
    await downloadCertificatePdf(certRef.current, `certificado-${courseTitle.toLowerCase().replace(/\s+/g, "-")}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-center justify-center">
            <PartyPopper size={20} className="text-amber-500" />
            Parabéns!
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Confetti */}
          <div className="relative h-2">
            {[...Array(14)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ y: -20, opacity: 1 }}
                animate={{ y: 60, opacity: 0 }}
                transition={{ duration: 1.4, delay: i * 0.05, repeat: Infinity, repeatDelay: 1 }}
                className="absolute top-0 w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${(i / 14) * 100}%`,
                  background: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899", "#8A05BE"][i % 5],
                }}
              />
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Você concluiu o mundo <span className="font-semibold text-foreground">{courseTitle}</span> e ganhou seu certificado.
          </p>

          <div className="rounded-xl overflow-hidden border border-border/50 bg-white">
            <CertificateView
              ref={certRef}
              studentName={studentName}
              courseTitle={courseTitle}
              code={code}
              issuedAt={issuedAt}
              color={color}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                onOpenChange(false);
                navigate(`/cursos/certificado/${certificateId}`);
              }}
              className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
            >
              <Eye size={14} /> Ver certificado
            </button>
            <button
              onClick={download}
              className="py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-glow flex items-center justify-center gap-1.5 transition-all"
            >
              <Download size={14} /> Baixar PDF
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default WorldCompleteDialog;
