import { forwardRef } from "react";
import { Award } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  userName: string;
  courseTitle: string;
  courseColor?: string;
  issuedAt: string;
  code: string;
}

const CertificateView = forwardRef<HTMLDivElement, Props>(
  ({ userName, courseTitle, courseColor = "#8A05BE", issuedAt, code }, ref) => {
    const date = format(new Date(issuedAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });

    return (
      <div
        ref={ref}
        className="relative w-full aspect-[1.414/1] max-w-[800px] mx-auto rounded-2xl overflow-hidden p-8 sm:p-12 flex flex-col"
        style={{
          background: `linear-gradient(135deg, ${courseColor}10 0%, hsl(var(--card)) 60%)`,
          border: `2px solid ${courseColor}55`,
          color: "hsl(var(--foreground))",
        }}
      >
        {/* Decoração */}
        <div
          aria-hidden="true"
          className="absolute -top-24 -right-24 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: courseColor }}
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full blur-3xl opacity-20"
          style={{ background: courseColor }}
        />

        <div className="relative flex flex-col h-full text-center justify-between">
          <div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: courseColor }}
              >
                <Award size={24} className="text-white" />
              </div>
              <span className="font-display text-xl font-bold">Harp</span>
            </div>
            <p className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              Certificado de Conclusão
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">Conferido a</p>
            <h2
              className="font-display text-3xl sm:text-4xl font-bold leading-tight"
              style={{ color: courseColor }}
            >
              {userName}
            </h2>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              por concluir com sucesso o mundo
            </p>
            <h3 className="font-display text-xl sm:text-2xl font-semibold">
              {courseTitle}
            </h3>
          </div>

          <div className="flex items-end justify-between text-[11px] text-muted-foreground pt-4">
            <div className="text-left">
              <div className="uppercase tracking-wider text-[9px]">Data</div>
              <div className="text-foreground font-medium text-sm">{date}</div>
            </div>
            <div className="text-right">
              <div className="uppercase tracking-wider text-[9px]">Código</div>
              <div className="text-foreground font-mono font-medium text-sm">{code}</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

CertificateView.displayName = "CertificateView";

export default CertificateView;
