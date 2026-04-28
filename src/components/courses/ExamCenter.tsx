import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Dumbbell, Timer, Repeat, ChevronRight, ArrowLeft, MessageCircleQuestion, Trophy, RefreshCw } from "lucide-react";
import { useCourses } from "@/hooks/useCourses";
import { useQuestionBank, sampleQuestions, getRecentWrongQuestions, type QuestionBankItem } from "@/hooks/useQuestionBank";
import { useUserStats } from "@/hooks/useUserStats";
import { useDailyMissions } from "@/hooks/useDailyMissions";
import { useToast } from "@/hooks/use-toast";
import QuestionsStep, { type QuestionResult } from "./quiz/QuestionsStep";

type Mode = "quick" | "full" | "errors";

const MODE_META: Record<Mode, { label: string; size: number; xp: number; icon: typeof Dumbbell; color: string; description: string }> = {
  quick:  { label: "Treino rápido",       size: 5,  xp: 15, icon: Dumbbell,             color: "hsl(150 65% 45%)", description: "5 perguntas variadas." },
  full:   { label: "Simulado completo",   size: 15, xp: 40, icon: Timer,                color: "hsl(280 75% 60%)", description: "15 perguntas com cronômetro." },
  errors: { label: "Revisão dos erros",   size: 8,  xp: 20, icon: Repeat,               color: "hsl(38 92% 55%)",  description: "Refaça questões que você errou." },
};

const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

const ExamCenter = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: courses } = useCourses();
  const { awardXp } = useUserStats();
  const { tick } = useDailyMissions();

  const [scope, setScope] = useState<string>("all");
  const [mode, setMode] = useState<Mode | null>(null);
  const [running, setRunning] = useState(false);
  const [questions, setQuestions] = useState<QuestionBankItem[]>([]);
  const [results, setResults] = useState<QuestionResult[] | null>(null);
  const [score, setScore] = useState(0);
  const [seconds, setSeconds] = useState(0);

  const { data: pool = [], isLoading } = useQuestionBank({ scope });

  useEffect(() => {
    if (!running || mode !== "full") return;
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [running, mode]);

  const startMode = (m: Mode) => {
    let picked: QuestionBankItem[] = [];
    if (m === "errors") {
      const wrong = getRecentWrongQuestions();
      const wrongSet = new Set(wrong.map((w) => `${w.lessonId}::${w.question}`));
      picked = pool.filter((q) => wrongSet.has(`${q.source_lesson_id}::${q.question}`));
      if (picked.length === 0) {
        toast({ title: "Sem erros recentes", description: "Você ainda não tem questões erradas para revisar." });
        return;
      }
      picked = sampleQuestions(picked, MODE_META.errors.size);
    } else {
      if (pool.length === 0) {
        toast({ title: "Sem perguntas", description: "Esse mundo ainda não tem perguntas suficientes." });
        return;
      }
      picked = sampleQuestions(pool, MODE_META[m].size);
    }
    setQuestions(picked);
    setMode(m);
    setResults(null);
    setScore(0);
    setSeconds(0);
    setRunning(true);
  };

  const onDone = async (s: number, _passed: boolean, r: QuestionResult[]) => {
    setRunning(false);
    setScore(s);
    setResults(r);
    if (mode === "quick") tick("complete_training");
    if (s >= 60 && mode) {
      try { await awardXp.mutateAsync(MODE_META[mode].xp); } catch {}
      toast({ title: `+${MODE_META[mode].xp} XP ⚡`, description: `Treino concluído (${s}%)` });
    }
    // Save exam result for mentor advice
    try {
      const key = "exam_results";
      const prev = JSON.parse(localStorage.getItem(key) || "[]");
      const next = [{ mode, score: s, scope, at: Date.now(), wrong: r.filter((x) => !x.isCorrect).length }, ...prev].slice(0, 10);
      localStorage.setItem(key, JSON.stringify(next));
    } catch {}
  };

  const reset = () => {
    setMode(null);
    setQuestions([]);
    setResults(null);
    setRunning(false);
    setScore(0);
    setSeconds(0);
  };

  // Per-topic breakdown
  const breakdown = useMemo(() => {
    if (!results) return [] as { topic: string; correct: number; total: number; pct: number; lessonIds: string[] }[];
    const map = new Map<string, { correct: number; total: number; lessonIds: Set<string> }>();
    for (const r of results) {
      const t = r.source_topic ?? "Geral";
      if (!map.has(t)) map.set(t, { correct: 0, total: 0, lessonIds: new Set() });
      const e = map.get(t)!;
      e.total += 1;
      if (r.isCorrect) e.correct += 1;
      if (r.source_lesson_id && !r.isCorrect) e.lessonIds.add(r.source_lesson_id);
    }
    return Array.from(map.entries()).map(([topic, v]) => ({
      topic,
      correct: v.correct,
      total: v.total,
      pct: Math.round((v.correct / v.total) * 100),
      lessonIds: Array.from(v.lessonIds),
    }));
  }, [results]);

  // -------- Render: results
  if (results) {
    const passed = score >= 60;
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
        <div
          className={`relative overflow-hidden rounded-2xl p-6 text-center space-y-3 border ${
            passed
              ? "border-emerald-500/30 bg-gradient-to-br from-emerald-500/15 via-transparent to-transparent"
              : "border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-transparent to-transparent"
          }`}
        >
          <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center shadow-glow ${
            passed ? "bg-gradient-to-br from-emerald-400 to-emerald-600" : "bg-gradient-to-br from-amber-400 to-orange-500"
          }`}>
            {passed ? <Trophy size={26} className="text-white" /> : <RefreshCw size={24} className="text-white" />}
          </div>
          <div>
            <h3 className="font-display text-xl font-bold">{passed ? "Bom trabalho!" : "Continue treinando"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              {results.filter((r) => r.isCorrect).length} de {results.length} acertos · {score}%
              {mode === "full" && ` · ${formatTime(seconds)}`}
            </p>
          </div>
        </div>

        {breakdown.length > 0 && (
          <div className="glass-card rounded-2xl p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">Desempenho por tópico</p>
            {breakdown.map((b) => (
              <div key={b.topic}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium truncate">{b.topic}</span>
                  <span className="tabular-nums text-muted-foreground">{b.correct}/{b.total} · {b.pct}%</span>
                </div>
                <div className="h-1.5 w-full bg-secondary/60 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${b.pct}%`,
                      background: b.pct >= 70 ? "hsl(150 65% 45%)" : b.pct >= 40 ? "hsl(38 92% 55%)" : "hsl(0 75% 55%)",
                    }}
                  />
                </div>
                {b.pct < 70 && b.lessonIds.length > 0 && (
                  <button
                    onClick={() => navigate(`/cursos/aula/${b.lessonIds[0]}?mode=review`)}
                    className="mt-1 text-[10px] text-amber-500 hover:underline flex items-center gap-1"
                  >
                    Revisar aula <ChevronRight size={10} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!passed && (
          <button
            onClick={() => {
              const topic = breakdown.sort((a, b) => a.pct - b.pct)[0]?.topic ?? "esse conteúdo";
              navigate("/chat", { state: { initialPrompt: `Estou com dificuldade em ${topic}. Pode me explicar com exemplos práticos?` } });
            }}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-purple-500 text-white font-medium text-sm shadow-glow flex items-center justify-center gap-2"
          >
            <MessageCircleQuestion size={16} /> Quer estudar isso com o Harp?
          </button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button onClick={reset} className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium">
            Voltar ao centro de treino
          </button>
          {mode && (
            <button
              onClick={() => startMode(mode)}
              className="py-2.5 rounded-xl gradient-primary text-white text-sm font-medium shadow-glow"
            >
              Refazer ({MODE_META[mode].label})
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // -------- Render: in progress
  if (running && mode) {
    const meta = MODE_META[mode];
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
        <div
          className="rounded-2xl p-4 flex items-center justify-between"
          style={{ background: `linear-gradient(135deg, ${meta.color}26, ${meta.color}08, hsl(var(--card)))`, border: `1px solid ${meta.color}33` }}
        >
          <div className="flex items-center gap-2.5">
            <button onClick={reset} className="p-1.5 rounded-full hover:bg-secondary/60">
              <ArrowLeft size={16} />
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-semibold" style={{ color: meta.color }}>
                {meta.label}
              </p>
              <p className="font-display text-sm font-bold leading-tight">{questions.length} perguntas</p>
            </div>
          </div>
          {mode === "full" && (
            <div className="text-xs font-mono tabular-nums px-2.5 py-1 rounded-md bg-card border border-border/50">
              {formatTime(seconds)}
            </div>
          )}
        </div>
        <QuestionsStep questions={questions} onDone={onDone} submitLabel="Finalizar treino" />
      </motion.div>
    );
  }

  // -------- Render: chooser
  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div className="glass-card rounded-2xl p-4">
        <p className="text-xs uppercase tracking-wider font-semibold text-muted-foreground mb-2">Escopo</p>
        <select
          value={scope}
          onChange={(e) => setScope(e.target.value)}
          className="w-full rounded-xl bg-secondary/30 border border-border/50 px-3 py-2 text-sm focus:outline-none focus:border-primary"
        >
          <option value="all">Todos os mundos</option>
          {courses?.map((c) => (
            <option key={c.id} value={c.id}>{c.title}</option>
          ))}
        </select>
        <p className="text-[11px] text-muted-foreground mt-2">
          {isLoading ? "Carregando banco de questões..." : `${pool.length} perguntas disponíveis no escopo.`}
        </p>
      </div>

      <div className="space-y-2">
        {(Object.keys(MODE_META) as Mode[]).map((m) => {
          const meta = MODE_META[m];
          const Icon = meta.icon;
          return (
            <button
              key={m}
              onClick={() => startMode(m)}
              className="w-full text-left rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              style={{
                background: `linear-gradient(135deg, ${meta.color}1f, ${meta.color}08, hsl(var(--card)))`,
                border: `1px solid ${meta.color}33`,
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: `linear-gradient(135deg, ${meta.color}, ${meta.color}cc)`, boxShadow: `0 6px 18px -8px ${meta.color}aa` }}
              >
                <Icon size={20} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-bold">{meta.label}</p>
                <p className="text-[11px] text-muted-foreground">{meta.description}</p>
              </div>
              <span className="text-[10px] font-semibold tabular-nums px-2 py-1 rounded-md" style={{ background: `${meta.color}20`, color: meta.color }}>
                +{meta.xp} XP
              </span>
              <ChevronRight size={16} className="text-muted-foreground shrink-0" />
            </button>
          );
        })}
      </div>
    </motion.div>
  );
};

export default ExamCenter;
