import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import { ChevronLeft, Lock, Check, Play } from "lucide-react";
import { useCourseLessons, type LessonWithProgress } from "@/hooks/useCourseLessons";
import StatsHeader from "./StatsHeader";
import { useToast } from "@/hooks/use-toast";

const NODE_OFFSETS = [0, 60, 90, 60, 0, -60, -90, -60]; // zigzag pattern in px

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

      {/* Trail container */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="relative pt-4"
      >
        {lessons.map((l, i) => {
          const offset = NODE_OFFSETS[i % NODE_OFFSETS.length];
          const isCurrent = i === currentIndex;
          const prevOffset = i > 0 ? NODE_OFFSETS[(i - 1) % NODE_OFFSETS.length] : null;
          const prevCompleted = i > 0 ? lessons[i - 1].completed : true;

          return (
            <div key={l.id} className="relative">
              {/* Connector line to previous node */}
              {i > 0 && prevOffset !== null && (
                <svg
                  className="absolute left-1/2 -translate-x-1/2 -top-12 pointer-events-none"
                  width="200"
                  height="48"
                  viewBox="0 0 200 48"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d={`M ${100 + prevOffset} 0 Q 100 24 ${100 + offset} 48`}
                    stroke={prevCompleted ? "hsl(142 71% 45%)" : "hsl(var(--border))"}
                    strokeWidth="3"
                    strokeDasharray="6 6"
                    strokeLinecap="round"
                  />
                </svg>
              )}

              {/* Node + side card */}
              <div className="flex justify-center mb-12 last:mb-0">
                <div
                  className="flex items-center gap-3"
                  style={{ transform: `translateX(${offset}px)` }}
                >
                  <button
                    onClick={() => handleClick(l)}
                    aria-label={`Aula ${i + 1}: ${l.title}`}
                    className={`relative w-[68px] h-[68px] rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${
                      l.unlocked ? "hover:scale-105 active:scale-95 cursor-pointer" : "cursor-not-allowed"
                    }`}
                    style={{
                      background: l.completed
                        ? "linear-gradient(135deg, hsl(142 76% 50%), hsl(142 71% 38%))"
                        : l.unlocked
                        ? `linear-gradient(135deg, ${color}, ${color}cc)`
                        : "hsl(var(--secondary))",
                      boxShadow: l.completed
                        ? "0 8px 24px -8px hsl(142 71% 45% / 0.5), inset 0 -3px 0 hsl(142 71% 30%)"
                        : l.unlocked
                        ? `0 8px 24px -8px ${color}88, inset 0 -3px 0 rgba(0,0,0,0.2)`
                        : "inset 0 -2px 0 hsl(var(--border))",
                      opacity: l.unlocked || l.completed ? 1 : 0.5,
                    }}
                  >
                    {/* Pulsing ring for current */}
                    {isCurrent && (
                      <span
                        className="absolute -inset-1 rounded-full animate-pulse opacity-40 pointer-events-none"
                        style={{ boxShadow: `0 0 0 3px ${color}` }}
                      />
                    )}
                    {l.completed ? (
                      <Check size={28} className="text-white" strokeWidth={3} />
                    ) : l.unlocked ? (
                      <Play size={24} className="text-white ml-1" fill="white" strokeWidth={2} />
                    ) : (
                      <Lock size={22} className="text-muted-foreground" />
                    )}
                  </button>

                  {/* Side card */}
                  <div
                    className={`min-w-0 max-w-[180px] glass-card rounded-xl px-3 py-2 shadow-lg ${
                      !l.unlocked ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] font-medium text-muted-foreground">Aula {i + 1}</span>
                      {isCurrent && (
                        <span className="text-[9px] uppercase tracking-wide px-1.5 py-px rounded-full bg-primary/15 text-primary font-semibold">
                          Atual
                        </span>
                      )}
                      {l.completed && (
                        <span className="text-[9px] uppercase tracking-wide px-1.5 py-px rounded-full bg-green-500/15 text-green-500 font-semibold">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-sm font-semibold leading-tight line-clamp-2">{l.title}</p>
                    {l.subtitle && (
                      <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">{l.subtitle}</p>
                    )}
                    <p className="text-[10px] text-primary mt-1 font-medium">+{l.xp_reward} XP</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
};

export default LessonPath;
