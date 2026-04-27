import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Lock, Check, Play } from "lucide-react";
import { useCourseLessons, type LessonWithProgress } from "@/hooks/useCourseLessons";
import StatsHeader from "./StatsHeader";
import { useToast } from "@/hooks/use-toast";

const LessonPath = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data, isLoading } = useCourseLessons(courseId);

  const handleClick = (l: LessonWithProgress) => {
    if (!l.unlocked) {
      toast({ title: "Aula bloqueada", description: "Complete a aula anterior para desbloquear." });
      return;
    }
    navigate(`/cursos/aula/${l.id}`);
  };

  const color = data?.course?.color ?? "hsl(var(--primary))";
  const lessons = data?.lessons ?? [];
  const currentIndex = lessons.findIndex((l) => l.unlocked && !l.completed);

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <button onClick={() => navigate("/cursos")} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold truncate">{data?.course?.title ?? "Mundo"}</h1>
          <p className="text-xs text-muted-foreground truncate">{data?.course?.description}</p>
        </div>
      </motion.div>

      <StatsHeader />

      {isLoading && <div className="text-center text-sm text-muted-foreground py-8">Carregando aulas...</div>}

      {!isLoading && lessons.length === 0 && (
        <div className="glass-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
          Nenhuma aula disponível neste mundo ainda.
        </div>
      )}

      {/* Vertical timeline */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative pt-2"
      >
        {/* Continuous background line */}
        {lessons.length > 1 && (
          <div
            aria-hidden="true"
            className="absolute left-7 top-8 bottom-8 w-0.5 bg-border z-0 -translate-x-1/2"
          />
        )}

        <ul className="space-y-4 relative z-10">
          {lessons.map((l, i) => {
            const isCurrent = i === currentIndex;
            const nextCompleted = i < lessons.length - 1 && l.completed && lessons[i + 1].completed;

            return (
              <li key={l.id} className="relative flex items-stretch gap-4">
                {/* Green segment between completed nodes */}
                {nextCompleted && (
                  <span
                    aria-hidden="true"
                    className="absolute left-7 top-14 h-[calc(100%+0px)] w-0.5 -translate-x-1/2 z-0"
                    style={{ background: "hsl(142 71% 45%)" }}
                  />
                )}

                {/* Node column (fixed 56px) */}
                <div className="w-14 shrink-0 flex justify-center">
                  <button
                    onClick={() => handleClick(l)}
                    aria-label={`Aula ${i + 1}: ${l.title}`}
                    className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-transform duration-200 z-10 ${
                      l.unlocked ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-not-allowed"
                    }`}
                    style={{
                      background: l.completed
                        ? "linear-gradient(135deg, hsl(142 76% 50%), hsl(142 71% 38%))"
                        : l.unlocked
                        ? `linear-gradient(135deg, ${color}, ${color}cc)`
                        : "hsl(var(--secondary))",
                      boxShadow: l.completed
                        ? "0 6px 18px -6px hsl(142 71% 45% / 0.5), inset 0 -3px 0 hsl(142 71% 30%)"
                        : l.unlocked
                        ? `0 6px 18px -6px ${color}88, inset 0 -3px 0 rgba(0,0,0,0.2)`
                        : "inset 0 -2px 0 hsl(var(--border))",
                      opacity: l.unlocked || l.completed ? 1 : 0.55,
                    }}
                  >
                    {isCurrent && (
                      <span
                        className="absolute -inset-1 rounded-full animate-pulse opacity-40 pointer-events-none"
                        style={{ boxShadow: `0 0 0 3px ${color}` }}
                      />
                    )}
                    {l.completed ? (
                      <Check size={24} className="text-white" strokeWidth={3} />
                    ) : l.unlocked ? (
                      <Play size={20} className="text-white ml-0.5" fill="white" strokeWidth={2} />
                    ) : (
                      <Lock size={18} className="text-muted-foreground" />
                    )}
                  </button>
                </div>

                {/* Content card */}
                <button
                  onClick={() => handleClick(l)}
                  disabled={!l.unlocked}
                  className={`flex-1 min-w-0 text-left glass-card rounded-2xl px-4 py-3 transition-all ${
                    l.unlocked ? "hover:translate-x-0.5 hover:shadow-lg cursor-pointer" : "opacity-60 cursor-not-allowed"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">
                      Aula {i + 1}
                    </span>
                    {isCurrent && (
                      <span className="text-[9px] uppercase tracking-wide px-1.5 py-px rounded-full bg-primary/15 text-primary font-semibold">
                        Atual
                      </span>
                    )}
                    {l.completed && (
                      <span className="text-[9px] uppercase tracking-wide px-1.5 py-px rounded-full bg-green-500/15 text-green-500 font-semibold">
                        Concluída
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-semibold leading-tight line-clamp-2">{l.title}</p>
                  {l.subtitle && (
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{l.subtitle}</p>
                  )}
                  <p className="text-[11px] mt-1.5 font-medium" style={{ color }}>
                    +{l.xp_reward} XP
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </motion.div>
    </div>
  );
};

export default LessonPath;
