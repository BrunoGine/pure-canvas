import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Loader2, GraduationCap, CheckCircle2, XCircle, RotateCcw, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { incrementAnswersCount } from "@/hooks/useBadges";

interface Question {
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  expected_keywords?: string[];
  explanation?: string;
}

interface SourcedQuestion extends Question {
  __lesson_id: string;
  __lesson_title: string;
  __weight: number;
}

interface Result {
  q: SourcedQuestion;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
}

const NUM_QUESTIONS = 10;

const pickWeighted = (pool: SourcedQuestion[], n: number): SourcedQuestion[] => {
  const arr = [...pool];
  const out: SourcedQuestion[] = [];
  while (arr.length > 0 && out.length < n) {
    const total = arr.reduce((s, q) => s + q.__weight, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (let i = 0; i < arr.length; i++) {
      r -= arr[i].__weight;
      if (r <= 0) {
        idx = i;
        break;
      }
    }
    out.push(arr.splice(idx, 1)[0]);
  }
  return out;
};

const MockExamPlayer = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"prepare" | "answering" | "results">("prepare");
  const [questions, setQuestions] = useState<SourcedQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, string | number>>({});
  const [results, setResults] = useState<Result[]>([]);

  const { data: pool, isLoading } = useQuery({
    queryKey: ["mock_exam_pool", user?.id, courseId ?? "all"],
    queryFn: async () => {
      if (!user) return [];
      // 1. progresso concluído (ou ao menos vídeo assistido) do usuário
      const { data: progress } = await (supabase as any)
        .from("user_progress")
        .select("lesson_id, video_watched, completed")
        .eq("user_id", user.id);
      const eligibleIds = new Set(
        (progress ?? [])
          .filter((p: any) => p.completed || p.video_watched)
          .map((p: any) => p.lesson_id),
      );
      if (eligibleIds.size === 0) return [];

      // 2. aulas (filtra por curso se houver)
      let lessonsQuery = (supabase as any).from("lessons").select("id, title, course_id, questions");
      if (courseId) lessonsQuery = lessonsQuery.eq("course_id", courseId);
      const { data: lessons } = await lessonsQuery;

      const filtered = (lessons ?? []).filter((l: any) => eligibleIds.has(l.id) && Array.isArray(l.questions) && l.questions.length > 0);

      // 3. monta pool com peso baseado em tentativas erradas
      const out: SourcedQuestion[] = [];
      for (const l of filtered) {
        let weight = 1;
        try {
          const raw = localStorage.getItem(`lesson_attempts_${l.id}`);
          if (raw) {
            const v = JSON.parse(raw);
            if (typeof v?.lastScore === "number" && v.lastScore < 60) weight = 3;
            else if (typeof v?.lastScore === "number" && v.lastScore < 80) weight = 2;
          }
        } catch {}
        for (const q of l.questions as Question[]) {
          out.push({ ...q, __lesson_id: l.id, __lesson_title: l.title, __weight: weight });
        }
      }
      return out;
    },
    enabled: !!user,
    staleTime: 30_000,
  });

  const start = () => {
    if (!pool || pool.length === 0) return;
    const picked = pickWeighted(pool, Math.min(NUM_QUESTIONS, pool.length));
    setQuestions(picked);
    setAnswers({});
    setResults([]);
    setStep("answering");
  };

  const submit = () => {
    const out: Result[] = questions.map((q, i) => {
      const ans = answers[i];
      let userAnswer = "";
      let correctAnswer = "";
      let isCorrect = false;
      if (q.type === "multiple_choice") {
        const idx = typeof ans === "number" ? ans : -1;
        userAnswer = idx >= 0 ? q.options?.[idx] ?? "" : "(sem resposta)";
        correctAnswer = q.correct_index !== undefined ? q.options?.[q.correct_index] ?? "" : "";
        isCorrect = idx === q.correct_index;
      } else {
        userAnswer = (typeof ans === "string" ? ans : "").trim() || "(sem resposta)";
        correctAnswer = (q.expected_keywords ?? []).join(", ");
        if (typeof ans === "string" && ans.trim().length > 5) {
          const lower = ans.toLowerCase();
          isCorrect = (q.expected_keywords ?? []).some((k) => lower.includes(k.toLowerCase())) || ans.trim().length > 30;
        }
      }
      return { q, userAnswer, correctAnswer, isCorrect };
    });
    setResults(out);
    incrementAnswersCount(out.length);
    try {
      const hist = JSON.parse(localStorage.getItem("mock_exam_history") || "[]");
      hist.unshift({
        at: Date.now(),
        courseId: courseId ?? null,
        score: Math.round((out.filter((r) => r.isCorrect).length / Math.max(1, out.length)) * 100),
        total: out.length,
      });
      localStorage.setItem("mock_exam_history", JSON.stringify(hist.slice(0, 20)));
    } catch {}
    setStep("results");
  };

  const allAnswered = useMemo(
    () => questions.length > 0 && questions.every((_, i) => answers[i] !== undefined && answers[i] !== ""),
    [questions, answers],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold truncate flex items-center gap-2">
            <GraduationCap size={20} className="text-primary" /> Treino para Prova
          </h1>
          <p className="text-xs text-muted-foreground">Simulado a partir das aulas que você já viu</p>
        </div>
      </div>

      {step === "prepare" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {!pool || pool.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-sm text-muted-foreground">
              Você precisa concluir (ou ao menos assistir) algumas aulas antes de treinar.
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <p className="text-sm">
                Seu banco tem <strong>{pool.length}</strong> perguntas disponíveis. Vamos sortear até{" "}
                <strong>{Math.min(NUM_QUESTIONS, pool.length)}</strong> — priorizando aulas em que você teve mais erro.
              </p>
              <button
                onClick={start}
                className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow"
              >
                Começar simulado
              </button>
            </div>
          )}
        </motion.div>
      )}

      {step === "answering" && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
          {questions.map((q, i) => (
            <div key={i} className="glass-card rounded-xl p-4 space-y-3">
              <p className="text-sm font-medium">
                {i + 1}. {q.question}
              </p>
              {q.type === "multiple_choice" ? (
                <div className="space-y-1.5">
                  {q.options?.map((opt, oi) => (
                    <button
                      key={oi}
                      onClick={() => setAnswers((p) => ({ ...p, [i]: oi }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm border transition-all ${
                        answers[i] === oi ? "border-primary bg-primary/10" : "border-border/50 hover:border-border"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              ) : (
                <textarea
                  value={(answers[i] as string) ?? ""}
                  onChange={(e) => setAnswers((p) => ({ ...p, [i]: e.target.value }))}
                  placeholder="Sua resposta..."
                  className="w-full min-h-[80px] rounded-lg bg-secondary/30 border border-border/50 p-2 text-sm focus:outline-none focus:border-primary"
                />
              )}
            </div>
          ))}
          <button
            onClick={submit}
            disabled={!allAnswered}
            className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow disabled:opacity-50"
          >
            Enviar respostas
          </button>
        </motion.div>
      )}

      {step === "results" && (
        <ResultsView
          results={results}
          onRetry={start}
          onBack={() => navigate(courseId ? `/cursos/${courseId}` : "/cursos")}
          onOpenLesson={(id) => navigate(`/cursos/aula/${id}`)}
        />
      )}
    </div>
  );
};

const ResultsView = ({
  results,
  onRetry,
  onBack,
  onOpenLesson,
}: {
  results: Result[];
  onRetry: () => void;
  onBack: () => void;
  onOpenLesson: (lessonId: string) => void;
}) => {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const score = Math.round((correct / Math.max(1, total)) * 100);
  const passed = score >= 60;

  // tópicos para revisar (aulas das questões erradas)
  const review = useMemo(() => {
    const map = new Map<string, { id: string; title: string; misses: number }>();
    for (const r of results) {
      if (r.isCorrect) continue;
      const cur = map.get(r.q.__lesson_id);
      if (cur) cur.misses += 1;
      else map.set(r.q.__lesson_id, { id: r.q.__lesson_id, title: r.q.__lesson_title, misses: 1 });
    }
    return Array.from(map.values()).sort((a, b) => b.misses - a.misses);
  }, [results]);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <div
        className={`rounded-2xl p-6 text-center space-y-2 border ${
          passed
            ? "border-green-500/30 bg-gradient-to-br from-green-500/15 via-emerald-500/5 to-transparent"
            : "border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent"
        }`}
      >
        <h2 className="font-display text-2xl font-bold">{passed ? "Boa!" : "Bora revisar"}</h2>
        <div className="flex items-center justify-center gap-4 pt-1">
          <div className="text-center">
            <div className={`font-display text-3xl font-bold ${passed ? "text-green-500" : "text-amber-500"}`}>
              {correct}<span className="text-lg text-muted-foreground">/{total}</span>
            </div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Acertos</div>
          </div>
          <div className="h-10 w-px bg-border/50" />
          <div className="text-center">
            <div className={`font-display text-3xl font-bold ${passed ? "text-green-500" : "text-amber-500"}`}>{score}%</div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Nota</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 flex items-center gap-2">
          <CheckCircle2 size={20} className="text-green-500" />
          <div>
            <div className="text-lg font-bold text-green-500 leading-none">{correct}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Corretas</div>
          </div>
        </div>
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-2">
          <XCircle size={20} className="text-red-500" />
          <div>
            <div className="text-lg font-bold text-red-500 leading-none">{total - correct}</div>
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Incorretas</div>
          </div>
        </div>
      </div>

      {review.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Tópicos para revisar</h3>
          {review.map((r) => (
            <button
              key={r.id}
              onClick={() => onOpenLesson(r.id)}
              className="w-full glass-card rounded-xl p-3 flex items-center gap-3 text-left hover:bg-primary/5 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-red-500/15 text-red-500 flex items-center justify-center font-bold text-sm shrink-0">
                {r.misses}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <p className="text-[10px] text-muted-foreground">{r.misses} erro(s) nesta aula</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={onRetry}
          className="py-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm flex items-center justify-center gap-2"
        >
          <RotateCcw size={14} /> Refazer
        </button>
        <button onClick={onBack} className="py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow">
          Voltar
        </button>
      </div>
    </motion.div>
  );
};

export default MockExamPlayer;
