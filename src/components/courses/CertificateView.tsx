import { forwardRef } from "react";
import { Award } from "lucide-react";

interface Props {
  studentName: string;
  courseTitle: string;
  code: string;
  issuedAt: string;
  color?: string;
}

const CertificateView = forwardRef<HTMLDivElement, Props>(
  ({ studentName, courseTitle, code, issuedAt, color = "#8A05BE" }, ref) => {
    const date = new Date(issuedAt).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });

    return (
      <div
        ref={ref}
        className="relative w-full aspect-[1.414/1] rounded-2xl overflow-hidden shadow-2xl"
        style={{
          background: `linear-gradient(135deg, #ffffff 0%, #fafafa 100%)`,
          color: "#1a1a1a",
        }}
      >
        {/* Border frame */}
        <div
          className="absolute inset-3 rounded-xl pointer-events-none"
          style={{ border: `2px solid ${color}` }}
        />
        <div
          className="absolute inset-5 rounded-lg pointer-events-none"
          style={{ border: `1px solid ${color}55` }}
        />

        {/* Top accent */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: `linear-gradient(90deg, ${color}, ${color}66)` }}
        />

        {/* Decorative corners */}
        <div
          className="absolute -top-20 -right-20 w-60 h-60 rounded-full opacity-10"
          style={{ background: color }}
        />
        <div
          className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full opacity-10"
          style={{ background: color }}
        />

        <div className="relative h-full flex flex-col items-center justify-center px-[8%] py-[6%] text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)` }}
          >
            <Award size={28} className="text-white" />
          </div>

          <p
            className="text-[10px] uppercase tracking-[0.3em] font-semibold mb-1"
            style={{ color }}
          >
            Certificado de Conclusão
          </p>
          <h1 className="font-display text-2xl md:text-3xl font-bold mb-3">Harpy</h1>

          <p className="text-xs text-gray-600 mb-2">Certificamos que</p>
          <p className="font-display text-xl md:text-2xl font-bold mb-3" style={{ color }}>
            {studentName}
          </p>

          <p className="text-xs text-gray-600 mb-1">concluiu com sucesso o módulo</p>
          <p className="text-base md:text-lg font-bold mb-4">{courseTitle}</p>

          <div className="w-full max-w-xs border-t border-gray-300 pt-3 flex items-center justify-between text-[10px] text-gray-600">
            <div>
              <p className="font-semibold">Emitido em</p>
              <p>{date}</p>
            </div>
            <div className="text-right">
              <p className="font-semibold">Código</p>
              <p className="font-mono">{code}</p>
            </div>
          </div>
        </div>
      </div>
    );
  },
);

CertificateView.displayName = "CertificateView";

export default CertificateView;
