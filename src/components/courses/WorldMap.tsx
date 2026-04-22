import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { GraduationCap, ChevronRight, Settings } from "lucide-react";
import StatsHeader from "./StatsHeader";
import { useCourses } from "@/hooks/useCourses";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const WorldMap = () => {
  const navigate = useNavigate();
  const { data: courses, isLoading } = useCourses();
  const { data: isAdmin } = useIsAdmin();

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <GraduationCap size={22} className="text-primary" /> Trilha
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Aprenda jogando</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => navigate("/cursos/admin")}
            className="p-2 rounded-xl hover:bg-secondary transition-colors"
            title="Painel admin"
          >
            <Settings size={18} className="text-muted-foreground" />
          </button>
        )}
      </motion.div>

      <StatsHeader />

      <div className="space-y-3">
        {isLoading && <div className="text-center text-sm text-muted-foreground py-8">Carregando mundos...</div>}
        {courses?.map((c, i) => {
          const Icon = (Icons as any)[c.icon] ?? GraduationCap;
          const pct = c.total_lessons > 0 ? (c.completed_lessons / c.total_lessons) * 100 : 0;
          return (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(`/cursos/${c.id}`)}
              className="glass-card rounded-2xl p-4 flex gap-4 items-center cursor-pointer hover:glow-border transition-all duration-300"
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-glow"
                style={{ background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)` }}
              >
                <Icon size={26} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm">{c.title}</h3>
                <p className="text-xs text-muted-foreground line-clamp-1 mb-2">{c.description}</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1.5 bg-secondary/50 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${pct}%`, background: c.color }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground tabular-nums">
                    {c.completed_lessons}/{c.total_lessons}
                  </span>
                </div>
              </div>
              <ChevronRight size={18} className="text-muted-foreground shrink-0" />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default WorldMap;
