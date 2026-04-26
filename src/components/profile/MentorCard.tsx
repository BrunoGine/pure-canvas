import { useNavigate } from "react-router-dom";
import { Sparkles, MessageCircle, ArrowRight } from "lucide-react";
import { useMentorAdvice } from "@/hooks/useMentorAdvice";
import { useContinueLesson } from "@/hooks/useContinueLesson";

const TONE_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  info: { bg: "bg-primary/10", border: "border-primary/30", text: "text-primary" },
  warning: { bg: "bg-amber-500/10", border: "border-amber-500/30", text: "text-amber-500" },
  success: { bg: "bg-green-500/10", border: "border-green-500/30", text: "text-green-500" },
};

const MentorCard = () => {
  const advice = useMentorAdvice();
  const { data: cont } = useContinueLesson();
  const navigate = useNavigate();
  const styles = TONE_STYLES[advice.tone];

  const handleCta = () => {
    if (!advice.cta) return;
    switch (advice.cta.action) {
      case "continue":
        if (cont) navigate(`/cursos/aula/${cont.lesson_id}`);
        else navigate("/cursos");
        break;
      case "chat":
        navigate("/chat");
        break;
      case "exam":
        navigate("/cursos/treino");
        break;
    }
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl p-4 border ${styles.border} ${styles.bg}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 gradient-primary shadow-glow`}>
          <Sparkles size={18} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-xs font-semibold uppercase tracking-wide">Mentor IA</p>
            <span className={`text-[9px] uppercase tracking-wide px-1.5 py-px rounded-full ${styles.text} bg-background/50`}>
              {advice.tone === "warning" ? "atenção" : advice.tone === "success" ? "boa!" : "dica"}
            </span>
          </div>
          <p className="text-sm leading-snug">{advice.message}</p>
          <div className="flex flex-wrap gap-2 mt-3">
            {advice.cta && (
              <button
                onClick={handleCta}
                className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-white font-medium flex items-center gap-1.5"
              >
                {advice.cta.label} <ArrowRight size={12} />
              </button>
            )}
            <button
              onClick={() => navigate("/chat")}
              className="text-xs px-3 py-1.5 rounded-lg bg-background/60 hover:bg-background font-medium flex items-center gap-1.5"
            >
              <MessageCircle size={12} /> Pedir conselho ao Harp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MentorCard;
