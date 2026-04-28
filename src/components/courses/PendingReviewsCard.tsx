import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { RotateCcw, ChevronRight, Clock } from "lucide-react";
import { useSpacedReviews } from "@/hooks/useSpacedReviews";

const PendingReviewsCard = () => {
  const navigate = useNavigate();
  const { data } = useSpacedReviews();

  const due = data?.due ?? [];
  if (due.length === 0) return null;

  const top = due.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl p-4 relative overflow-hidden"
      style={{
        background: "linear-gradient(135deg, hsl(38 92% 55% / 0.14), hsl(20 90% 55% / 0.05), hsl(var(--card)))",
        border: "1px solid hsl(38 92% 55% / 0.28)",
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, hsl(38 92% 55%), hsl(20 90% 55%))",
              boxShadow: "0 6px 18px -8px hsl(38 92% 55% / 0.7)",
            }}
          >
            <RotateCcw size={16} className="text-white" />
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wider font-semibold text-amber-500">Revisão espaçada</p>
            <p className="font-display text-base font-bold leading-tight">Revisões pendentes</p>
          </div>
        </div>
        <span className="text-[11px] font-semibold tabular-nums text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
          {due.length}
        </span>
      </div>

      <div className="space-y-2">
        {top.map(({ lessonId, lesson, course, overdueDays }) => {
          const color = course?.color ?? "hsl(var(--primary))";
          return (
            <button
              key={lessonId}
              onClick={() => navigate(`/cursos/aula/${lessonId}?mode=review`)}
              className="w-full text-left rounded-xl p-3 bg-card/60 hover:bg-card border border-border/40 hover:shadow-md transition-all flex items-center gap-3"
            >
              <div
                className="w-2 h-10 rounded-full shrink-0"
                style={{ background: `linear-gradient(180deg, ${color}, ${color}aa)` }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{lesson?.title ?? "Aula"}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {course?.title ?? "Mundo"}
                  {overdueDays > 0 && (
                    <span className="ml-1.5 inline-flex items-center gap-0.5 text-amber-500">
                      <Clock size={9} /> atrasada {overdueDays}d
                    </span>
                  )}
                </p>
              </div>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>

      {due.length > 3 && (
        <button
          onClick={() => navigate("/cursos/progresso?tab=treino")}
          className="mt-3 w-full text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
        >
          Ver todas ({due.length}) <ChevronRight size={12} />
        </button>
      )}
    </motion.div>
  );
};

export default PendingReviewsCard;
