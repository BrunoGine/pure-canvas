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

      <div className="relative">
        {data?.lessons.map((l, i) => {
          const offset = i % 4;
          const positions = ["ml-0", "ml-12", "ml-20", "ml-12"];
          const color = data.course?.color ?? "hsl(var(--primary))";
          return (
            <motion.div
              key={l.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className={`relative ${positions[offset]} mb-4 flex items-center gap-3`}
            >
              <button
                onClick={() => handleClick(l)}
                className={`relative w-16 h-16 rounded-full flex items-center justify-center shrink-0 transition-all duration-300 ${
                  l.completed
                    ? "shadow-glow"
                    : l.unlocked
                    ? "shadow-glow hover:scale-105"
                    : "opacity-50 cursor-not-allowed"
                }`}
                style={{
                  background: l.completed
                    ? "linear-gradient(135deg, #10B981, #059669)"
                    : l.unlocked
                    ? `linear-gradient(135deg, ${color}, ${color}aa)`
                    : "hsl(var(--secondary))",
                }}
              >
                {l.unlocked && !l.completed && (
                  <span
                    className="absolute inset-0 rounded-full animate-ping opacity-30"
                    style={{ background: color }}
                  />
                )}
                {l.completed ? (
                  <Check size={26} className="text-white" />
                ) : l.unlocked ? (
                  <Play size={22} className="text-white ml-1" fill="white" />
                ) : (
                  <Lock size={22} className="text-muted-foreground" />
                )}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold leading-tight ${!l.unlocked ? "text-muted-foreground" : ""}`}>
                  Aula {i + 1}: {l.title}
                </p>
                {l.subtitle && <p className="text-xs text-muted-foreground line-clamp-1">{l.subtitle}</p>}
                <p className="text-[10px] text-primary mt-0.5">+{l.xp_reward} XP</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default LessonPath;
