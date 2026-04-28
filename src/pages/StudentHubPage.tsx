import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, User, BarChart3, Award, Dumbbell, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserStats, xpForLevel, xpForNextLevel } from "@/hooks/useUserStats";
import { useCourses } from "@/hooks/useCourses";
import { useContinueLesson } from "@/hooks/useContinueLesson";
import StatsHeader from "@/components/courses/StatsHeader";
import BadgesGrid from "@/components/courses/BadgesGrid";
import CertificatesList from "@/components/courses/CertificatesList";
import ExamCenter from "@/components/courses/ExamCenter";

type Tab = "progresso" | "certificados" | "treino";

const TABS: { key: Tab; label: string; icon: typeof BarChart3 }[] = [
  { key: "progresso", label: "Progresso", icon: BarChart3 },
  { key: "certificados", label: "Certificados", icon: Award },
  { key: "treino", label: "Treino", icon: Dumbbell },
];

const StudentHubPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get("tab") as Tab) ?? "progresso";
  const [tab, setTab] = useState<Tab>(initialTab);

  const { data: stats } = useUserStats();
  const { data: courses } = useCourses();
  const { data: continueData } = useContinueLesson();

  const [profile, setProfile] = useState<{ display_name: string | null; avatar_url: string | null } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name, avatar_url")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => setProfile(data ?? null));
  }, [user]);

  useEffect(() => {
    setParams({ tab }, { replace: true });
  }, [tab, setParams]);

  const totals = useMemo(() => {
    if (!courses) return { lessons: 0, completedLessons: 0, worldsDone: 0, worlds: 0 };
    let lessons = 0;
    let completedLessons = 0;
    let worldsDone = 0;
    for (const c of courses) {
      lessons += c.total_lessons ?? 0;
      completedLessons += c.completed_lessons ?? 0;
      if (c.total_lessons > 0 && c.completed_lessons === c.total_lessons) worldsDone += 1;
    }
    return { lessons, completedLessons, worldsDone, worlds: courses.length };
  }, [courses]);

  const level = stats?.level ?? 1;
  const xp = stats?.xp ?? 0;
  const next = xpForNextLevel(level);
  const base = xpForLevel(level);
  const levelPct = Math.min(100, Math.round(((xp - base) / Math.max(1, next - base)) * 100));

  const displayName = profile?.display_name || user?.user_metadata?.display_name || "Aluno";
  const overallPct = totals.lessons > 0 ? Math.round((totals.completedLessons / totals.lessons) * 100) : 0;

  void continueData;

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <button
          onClick={() => navigate("/cursos")}
          className="p-1.5 rounded-full hover:bg-secondary transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold flex items-center gap-2">
            <GraduationCap size={20} className="text-primary" /> Perfil do Aluno
          </h1>
          <p className="text-xs text-muted-foreground">Sua jornada de aprendizado</p>
        </div>
      </motion.div>

      {/* Identity */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 glass-card flex items-center gap-4"
      >
        <div className="w-16 h-16 rounded-full overflow-hidden bg-secondary flex items-center justify-center border-2 border-primary/20 shadow-glow shrink-0">
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            <User size={28} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">Nível {level}</p>
          <p className="font-display text-lg font-bold leading-tight truncate">{displayName}</p>
          <div className="mt-2">
            <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
              <span className="tabular-nums">{xp} XP</span>
              <span className="tabular-nums">{Math.max(0, next - xp)} p/ Nv {level + 1}</span>
            </div>
            <div className="h-1.5 bg-secondary/60 rounded-full overflow-hidden">
              <div className="h-full gradient-primary transition-all duration-500" style={{ width: `${levelPct}%` }} />
            </div>
          </div>
        </div>
      </motion.div>

      <StatsHeader />

      {/* Tabs */}
      <div className="flex gap-1.5 p-1 rounded-xl bg-secondary/50">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all ${
              tab === key ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {tab === "progresso" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Aulas" value={totals.completedLessons} suffix={`/${totals.lessons}`} />
            <Stat label="Mundos" value={totals.worldsDone} suffix={`/${totals.worlds}`} />
            <Stat label="Geral" value={`${overallPct}%`} />
          </div>

          <div>
            <h2 className="font-display text-sm font-bold mb-2 px-1">Conquistas</h2>
            <BadgesGrid />
          </div>

          <div>
            <h2 className="font-display text-sm font-bold mb-2 px-1">Mundos</h2>
            <div className="space-y-2">
              {courses?.map((c) => {
                const pct = c.total_lessons > 0 ? Math.round((c.completed_lessons / c.total_lessons) * 100) : 0;
                return (
                  <button
                    key={c.id}
                    onClick={() => navigate(`/cursos/${c.id}`)}
                    className="w-full text-left glass-card rounded-xl p-3 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <p className="text-sm font-semibold truncate">{c.title}</p>
                      <span className="text-[11px] tabular-nums font-semibold" style={{ color: c.color }}>
                        {pct}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${c.color}, ${c.color}cc)` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {tab === "certificados" && (
        <div>
          <h2 className="font-display text-sm font-bold mb-2 px-1">Seus certificados</h2>
          <CertificatesList />
        </div>
      )}

      {tab === "treino" && <ExamCenter />}
    </div>
  );
};

const Stat = ({ label, value, suffix }: { label: string; value: string | number; suffix?: string }) => (
  <div className="glass-card rounded-xl p-3 text-center">
    <p className="font-display text-xl font-bold leading-none">
      {value}
      {suffix && <span className="text-xs text-muted-foreground font-normal">{suffix}</span>}
    </p>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">{label}</p>
  </div>
);

export default StudentHubPage;
