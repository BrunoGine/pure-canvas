import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import * as Icons from "lucide-react";
import { GraduationCap, ChevronRight, Settings, BarChart3 } from "lucide-react";
import StatsHeader from "./StatsHeader";
import ContinueCard from "./ContinueCard";
import MentorCard from "./MentorCard";
import QuickActions from "./QuickActions";
import { useCourses } from "@/hooks/useCourses";
import { useIsAdmin } from "@/hooks/useIsAdmin";

const LEVEL_LABEL: Record<string, string> = {
  beginner: "Iniciante",
  intermediate: "Intermediário",
  advanced: "Avançado",
  iniciante: "Iniciante",
  intermediario: "Intermediário",
  avancado: "Avançado",
};

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
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => navigate("/cursos/progresso")}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 hover:bg-primary/15 text-primary text-xs font-semibold transition-colors"
            title="Perfil do Aluno"
          >
            <BarChart3 size={14} /> Meu Progresso
          </button>
          {isAdmin && (
            <button
              onClick={() => navigate("/cursos/admin")}
              className="p-2 rounded-xl hover:bg-secondary transition-colors"
              title="Painel admin"
            >
              <Settings size={18} className="text-muted-foreground" />
            </button>
          )}
        </div>
      </motion.div>

      <StatsHeader />
      <ContinueCard />
      <MentorCard />
      <QuickActions />

      <div id="worlds-grid" className="space-y-4">
        {isLoading && <div className="text-center text-sm text-muted-foreground py-8">Carregando mundos...</div>}
        {courses?.map((c, i) => {
          const Icon = (Icons as any)[c.icon] ?? GraduationCap;
          const pct = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
          const levelLabel = LEVEL_LABEL[c.level?.toLowerCase()] ?? c.level ?? "Iniciante";

          return (
            <motion.button
              key={c.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + i * 0.05 }}
              onClick={() => navigate(`/cursos/${c.id}`)}
              className="group relative w-full text-left overflow-hidden rounded-3xl p-6 min-h-[160px] shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              style={{
                background: `linear-gradient(135deg, ${c.color}22 0%, ${c.color}08 60%, hsl(var(--card)) 100%)`,
                border: `1px solid ${c.color}33`,
              }}
            >
              {/* Decorative glow */}
              <span
                aria-hidden="true"
                className="absolute -top-12 -right-12 w-48 h-48 rounded-full blur-2xl opacity-25 pointer-events-none"
                style={{ background: c.color }}
              />

              <div className="relative flex flex-col h-full gap-4">
                {/* Top row: icon + level pill + chevron */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                      style={{
                        background: `linear-gradient(135deg, ${c.color}, ${c.color}cc)`,
                        boxShadow: `0 8px 20px -8px ${c.color}88`,
                      }}
                    >
                      <Icon size={24} className="text-white" />
                    </div>
                    <span
                      className="text-[10px] uppercase tracking-wider font-semibold px-2.5 py-1 rounded-full"
                      style={{
                        background: `${c.color}1f`,
                        color: c.color,
                      }}
                    >
                      {levelLabel}
                    </span>
                  </div>
                  <ChevronRight
                    size={20}
                    className="text-muted-foreground shrink-0 transition-transform group-hover:translate-x-0.5"
                  />
                </div>

                {/* Title + description */}
                <div className="min-w-0">
                  <h3 className="font-display text-2xl font-bold leading-tight">{c.title}</h3>
                  {c.description && (
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{c.description}</p>
                  )}
                </div>

                {/* Progress */}
                <div className="mt-auto">
                  <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
                    <span className="tabular-nums">
                      {c.completed_lessons} de {c.total_lessons} aulas
                    </span>
                    <span className="tabular-nums font-semibold" style={{ color: c.color }}>
                      {pct}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-secondary/60 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${pct}%`,
                        background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
};

export default WorldMap;
