import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Play, ArrowRight, Sparkles } from "lucide-react";
import { useContinueLesson } from "@/hooks/useContinueLesson";

const ContinueCard = () => {
  const navigate = useNavigate();
  const { data, isLoading } = useContinueLesson();

  if (isLoading) {
    return (
      <div className="rounded-2xl p-5 min-h-[120px] glass-card animate-pulse">
        <div className="h-3 w-24 bg-secondary/60 rounded mb-3" />
        <div className="h-5 w-2/3 bg-secondary/60 rounded mb-2" />
        <div className="h-2 w-full bg-secondary/40 rounded" />
      </div>
    );
  }

  if (!data || data.status === "empty" || !data.lesson || !data.course) {
    return (
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => {
          const el = document.getElementById("worlds-grid");
          el?.scrollIntoView({ behavior: "smooth" });
        }}
        className="w-full text-left rounded-2xl p-5 glass-card hover:shadow-elevated transition-all"
      >
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center shadow-glow shrink-0">
            <Sparkles size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">Comece sua jornada</p>
            <p className="font-display text-base font-bold leading-tight mt-0.5">Escolha um mundo abaixo</p>
            <p className="text-xs text-muted-foreground mt-0.5">Aprenda finanças jogando</p>
          </div>
          <ArrowRight size={18} className="text-muted-foreground shrink-0" />
        </div>
      </motion.button>
    );
  }

  const color = data.course.color;

  return (
    <motion.button
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(`/cursos/aula/${data.lesson!.id}`)}
      className="group w-full text-left rounded-2xl p-5 shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${color}26 0%, ${color}0a 60%, hsl(var(--card)) 100%)`,
        border: `1px solid ${color}40`,
      }}
    >
      <span
        aria-hidden="true"
        className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
        style={{ background: color }}
      />
      <div className="relative flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 8px 20px -8px ${color}aa` }}
        >
          <Play size={22} className="text-white ml-0.5" fill="white" strokeWidth={2} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color }}>
            {data.status === "next" ? "Próxima aula" : "Continue de onde parou"}
          </p>
          <p className="font-display text-base font-bold leading-tight mt-0.5 truncate">
            {data.lesson.title}
          </p>
          <p className="text-xs text-muted-foreground truncate">{data.course.title}</p>
        </div>
        <ArrowRight size={18} className="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5" />
      </div>
      {data.totalLessons > 0 && (
        <div className="relative mt-3">
          <div className="flex items-center justify-between text-[11px] text-muted-foreground mb-1">
            <span className="tabular-nums">{data.completedLessons} / {data.totalLessons} aulas</span>
            <span className="tabular-nums font-semibold" style={{ color }}>{data.progressPct}%</span>
          </div>
          <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${data.progressPct}%`, background: `linear-gradient(90deg, ${color}, ${color}cc)` }}
            />
          </div>
        </div>
      )}
    </motion.button>
  );
};

export default ContinueCard;
