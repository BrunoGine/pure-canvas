import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Play,
  FileText,
  HelpCircle,
  Trophy,
  Sparkles,
  Loader2,
  RotateCcw,
  Youtube,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ArrowRight,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { useUserStats } from "@/hooks/useUserStats";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useCourseLessons } from "@/hooks/useCourseLessons";
import { useCertificates } from "@/hooks/useCertificates";
import { useBadges } from "@/hooks/useBadges";
import { useAuth } from "@/contexts/AuthContext";
import WorldCompleteDialog from "./WorldCompleteDialog";

interface Question {
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  expected_keywords?: string[];
  explanation?: string;
}

interface QuestionResult {
  question: string;
  type: "multiple_choice" | "open";
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  expectedKeywords?: string[];
}

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { upsert, data: progress } = useLessonProgress(lessonId);
  const { awardXp, updateStreak } = useUserStats();
  const { issue: issueCertificate } = useCertificates();
  const { award: awardBadge } = useBadges();
  const { user } = useAuth();
  const [step, setStep] = useState<number>(-1); // -1=unset, 0=video, 1=summary, 2=quiz, 3=completion (deprecated path), 4=review menu, 5=quiz results
  const [reviewMode, setReviewMode] = useState(false);
  const [lastResults, setLastResults] = useState<QuestionResult[]>([]);
  const [lastScore, setLastScore] = useState(0);
  const [lastPassed, setLastPassed] = useState(false);
  const [quizResetKey, setQuizResetKey] = useState(0);
  const [studentName, setStudentName] = useState("Aluno");
  const [worldCertificate, setWorldCertificate] = useState<{ id: string; code: string; issued_at: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name || user.user_metadata?.display_name || "Aluno";
        setStudentName(n);
      });
  }, [user]);

  const { data: lesson, isLoading: lessonLoading } = useQuery({
    queryKey: ["lesson", lessonId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("lessons").select("*").eq("id", lessonId).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!lessonId,
  });

  const { data: aiContent, isLoading: aiLoading, refetch: refetchAi } = useQuery({
    queryKey: ["lesson_ai", lessonId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("generate-lesson-content", {
        body: { lesson_id: lessonId },
      });
      if (error) throw error;
      return data as { summary: string | null; questions: Question[] };
    },
    enabled: false,
    staleTime: Infinity,
  });

  const { data: courseData } = useCourseLessons(lesson?.course_id);

  const nextLesson = useMemo(() => {
    if (!courseData || !lesson) return null;
    const list = courseData.lessons;
    const idx = list.findIndex((l) => l.id === lesson.id);
    if (idx === -1 || idx === list.length - 1) return null;
    return list[idx + 1];
  }, [courseData, lesson]);

  // Initial step based on progress
  useEffect(() => {
    if (step !== -1) return;
    if (!progress) {
      setStep(0);
      return;
    }
    if (progress.completed) {
      setStep(4); // review menu
    } else if (progress.summary_read) {
      setStep(2);
    } else if (progress.video_watched) {
      setStep(1);
    } else {
      setStep(0);
    }
  }, [progress, step]);

  useEffect(() => {
    if ((step === 1 || step === 2) && !aiContent && !aiLoading) refetchAi();
  }, [step]);

  const handleVideoDone = async () => {
    if (reviewMode) {
      const key = `review_video_xp_${lessonId}_${new Date().toISOString().slice(0, 10)}`;
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, "1");
        await awardXp.mutateAsync(5);
        toast({ title: "+5 XP ⚡", description: "Modo revisão — XP reduzido" });
      }
      setStep(1);
      return;
    }
    if (!progress?.video_watched) {
      await upsert.mutateAsync({ video_watched: true });
      await awardXp.mutateAsync(10);
      toast({ title: "+10 XP ⚡", description: "Vídeo concluído!" });
    }
    setStep(1);
  };

  const handleSummaryDone = async () => {
    if (reviewMode) {
      setStep(2);
      return;
    }
    if (!progress?.summary_read) {
      await upsert.mutateAsync({ summary_read: true });
      await awardXp.mutateAsync(10);
      toast({ title: "+10 XP ⚡", description: "Resumo lido!" });
    }
    setStep(2);
  };

  const finishQuiz = async (score: number, passed: boolean, results: QuestionResult[]) => {
    setLastResults(results);
    setLastScore(score);
    setLastPassed(passed);

    // Persistir tentativas localmente (sem mudança de schema)
    try {
      const key = `lesson_attempts_${lessonId}`;
      const prev = JSON.parse(localStorage.getItem(key) || "{}");
      const attempts = (prev.attempts ?? 0) + 1;
      localStorage.setItem(
        key,
        JSON.stringify({ attempts, lastScore: score, lastPassed: passed, lastResults, at: Date.now() }),
      );
    } catch {
      // ignore
    }

    if (reviewMode) {
      const bestScore = Math.max(progress?.score ?? 0, score);
      if (bestScore !== (progress?.score ?? 0)) {
        await upsert.mutateAsync({ score: bestScore });
      }
      if (passed) {
        await awardXp.mutateAsync(10);
        toast({ title: "+10 XP ⚡", description: "Modo revisão — XP reduzido" });
      }
      qc.invalidateQueries({ queryKey: ["course_lessons"] });
      setStep(5);
      return;
    }

    if (passed) {
      const xpReward = lesson?.xp_reward ?? 50;
      await upsert.mutateAsync({
        questions_passed: true,
        score,
        completed: true,
        completed_at: new Date().toISOString(),
      });
      await awardXp.mutateAsync(xpReward);
      await updateStreak.mutateAsync();
      qc.invalidateQueries({ queryKey: ["course_lessons"] });
      qc.invalidateQueries({ queryKey: ["courses"] });
      toast({ title: `+${xpReward} XP ⚡`, description: "Aula concluída!" });

      // Award "first lesson" badge
      try { await awardBadge.mutateAsync("first_lesson"); } catch {}

      // Check if this lesson completes the world (last incomplete lesson)
      try {
        const allLessons = courseData?.lessons ?? [];
        const remaining = allLessons.filter((l) => l.id !== lesson.id && !l.completed);
        const isLastOfWorld = allLessons.length > 0 && remaining.length === 0;
        if (isLastOfWorld) {
          const cert = await issueCertificate.mutateAsync(lesson.course_id);
          await awardBadge.mutateAsync("world_complete");
          await awardBadge.mutateAsync("certified");
          if (cert) {
            setWorldCertificate({ id: cert.id, code: cert.code, issued_at: cert.issued_at });
          }
        }
      } catch (e) {
        console.error("World completion error:", e);
      }
    } else {
      // Reforço: salva apenas score e marca questions_passed=false. Não conclui.
      await upsert.mutateAsync({
        questions_passed: false,
        score,
      });
    }
    setStep(5);
  };

  const startReview = (mode: "video" | "quiz") => {
    setReviewMode(true);
    setQuizResetKey((k) => k + 1);
    setStep(mode === "video" ? 0 : 2);
    if (mode === "quiz" && !aiContent && !aiLoading) refetchAi();
  };

  const goToNextLesson = () => {
    if (nextLesson) {
      navigate(`/cursos/aula/${nextLesson.id}`);
    } else {
      navigate(`/cursos/${lesson.course_id}`);
    }
  };

  const reinforceWatch = () => {
    setReviewMode(true);
    setQuizResetKey((k) => k + 1);
    setStep(0);
  };

  const retryQuiz = () => {
    setReviewMode(true);
    setQuizResetKey((k) => k + 1);
    setStep(2);
  };

  if (lessonLoading || !lesson || step === -1) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <button onClick={() => navigate(-1)} className="p-1.5 rounded-full hover:bg-secondary transition-colors">
          <ChevronLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-lg font-bold truncate">{lesson.title}</h1>
          {lesson.subtitle && <p className="text-xs text-muted-foreground truncate">{lesson.subtitle}</p>}
        </div>
        {reviewMode && (
          <span className="text-[10px] uppercase tracking-wide px-2 py-1 rounded-full bg-amber-500/15 text-amber-500 font-semibold shrink-0">
            Revisão
          </span>
        )}
      </motion.div>

      {/* Stepper */}
      {step !== 4 && step !== 5 && (
        <div className="flex items-center gap-1.5">
          {[
            { i: 0, icon: Play, label: "Vídeo" },
            { i: 1, icon: FileText, label: "Resumo" },
            { i: 2, icon: HelpCircle, label: "Quiz" },
            { i: 3, icon: Trophy, label: "Fim" },
          ].map(({ i, icon: Icon, label }) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  step >= i ? "gradient-primary text-white shadow-glow" : "bg-secondary text-muted-foreground"
                }`}
              >
                <Icon size={14} />
              </div>
              <span className={`text-[9px] ${step >= i ? "text-primary" : "text-muted-foreground"}`}>{label}</span>
            </div>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        {step === 4 && (
          <ReviewMenu
            key="review"
            score={progress?.score ?? 0}
            onWatch={() => startReview("video")}
            onQuiz={() => startReview("quiz")}
            onBack={() => navigate(`/cursos/${lesson.course_id}`)}
          />
        )}

        {step === 0 && (
          <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="aspect-video rounded-xl overflow-hidden border border-border/50">
              <iframe
                src={`https://www.youtube.com/embed/${lesson.youtube_video_id}`}
                title={lesson.title}
                loading="lazy"
                allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>
            {lesson.video_credit && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground px-1">
                <Youtube size={12} className="text-red-500" />
                Créditos: <span className="text-foreground/80">{lesson.video_credit}</span>
              </p>
            )}
            <button
              onClick={handleVideoDone}
              className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow hover:shadow-elevated transition-all"
            >
              {reviewMode ? "Continuar" : "Já assisti — Continuar"}
            </button>
          </motion.div>
        )}

        {step === 1 && (
          <motion.div key="summary" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-3">
            <div className="glass-card rounded-xl p-4 min-h-[200px]">
              {aiLoading || !aiContent ? (
                <div className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
                  <Loader2 className="animate-spin" size={16} /> Gerando resumo...
                </div>
              ) : aiContent.summary || lesson.summary ? (
                <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:text-sm [&_li]:text-sm">
                  <ReactMarkdown>{aiContent.summary || lesson.summary}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Resumo indisponível no momento. Você pode continuar mesmo assim.
                </p>
              )}
            </div>
            <button
              onClick={handleSummaryDone}
              disabled={aiLoading}
              className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow disabled:opacity-50 transition-all"
            >
              Continuar
            </button>
          </motion.div>
        )}

        {step === 2 && (
          <QuestionsStep
            key={`quiz-${quizResetKey}`}
            questions={(aiContent?.questions ?? lesson.questions ?? []) as Question[]}
            onDone={finishQuiz}
            loading={aiLoading}
          />
        )}

        {step === 5 && (
          <QuizResultsStep
            key="results"
            results={lastResults}
            score={lastScore}
            passed={lastPassed}
            xpReward={lesson.xp_reward ?? 50}
            reviewMode={reviewMode}
            hasNext={!!nextLesson}
            onNext={goToNextLesson}
            onRetry={retryQuiz}
            onRewatch={reinforceWatch}
            onBack={() => navigate(`/cursos/${lesson.course_id}`)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

const ReviewMenu = ({
  score,
  onWatch,
  onQuiz,
  onBack,
}: {
  score: number;
  onWatch: () => void;
  onQuiz: () => void;
  onBack: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.96 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0 }}
    className="glass-card rounded-2xl p-6 space-y-4 shadow-lg"
  >
    <div className="flex items-center justify-center gap-2 text-green-500">
      <Trophy size={28} />
      <span className="font-display text-lg font-bold">Aula concluída</span>
    </div>
    <p className="text-center text-sm text-muted-foreground">
      Score atual: <span className="text-foreground font-semibold">{score}%</span>
    </p>
    <div className="space-y-2 pt-2">
      <button
        onClick={onWatch}
        className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm flex items-center justify-center gap-2 transition-all"
      >
        <Play size={16} /> Reassistir vídeo
      </button>
      <button
        onClick={onQuiz}
        className="w-full py-3 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm flex items-center justify-center gap-2 transition-all"
      >
        <RotateCcw size={16} /> Refazer exercícios
      </button>
      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow transition-all"
      >
        Voltar à trilha
      </button>
    </div>
    <p className="text-[11px] text-center text-muted-foreground pt-1">
      Refazer dá XP reduzido e não afeta sua ofensiva.
    </p>
  </motion.div>
);

const QuestionsStep = ({
  questions,
  onDone,
  loading,
}: {
  questions: Question[];
  onDone: (score: number, passed: boolean, results: QuestionResult[]) => void;
  loading: boolean;
}) => {
  const [answers, setAnswers] = useState<Record<number, string | number>>({});

  if (loading) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center py-12 gap-2 text-sm text-muted-foreground">
        <Loader2 className="animate-spin" size={16} /> Carregando perguntas...
      </motion.div>
    );
  }

  if (!questions || questions.length === 0) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-3">
        <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">
          Perguntas indisponíveis. Marque a aula como concluída para seguir.
        </div>
        <button
          onClick={() => onDone(100, true, [])}
          className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow"
        >
          Concluir aula
        </button>
      </motion.div>
    );
  }

  const submit = () => {
    const results: QuestionResult[] = questions.map((q, i) => {
      const ans = answers[i];
      let isCorrect = false;
      let userAnswer = "";
      let correctAnswer = "";

      if (q.type === "multiple_choice") {
        const userIdx = typeof ans === "number" ? ans : -1;
        userAnswer = userIdx >= 0 ? q.options?.[userIdx] ?? "" : "(sem resposta)";
        correctAnswer = q.correct_index !== undefined ? q.options?.[q.correct_index] ?? "" : "";
        isCorrect = userIdx === q.correct_index;
      } else {
        userAnswer = (typeof ans === "string" ? ans : "").trim() || "(sem resposta)";
        correctAnswer = (q.expected_keywords ?? []).join(", ");
        if (typeof ans === "string" && ans.trim().length > 5) {
          const lower = ans.toLowerCase();
          const hit = (q.expected_keywords ?? []).some((k) => lower.includes(k.toLowerCase()));
          isCorrect = hit || ans.trim().length > 30;
        }
      }

      return {
        question: q.question,
        type: q.type,
        userAnswer,
        correctAnswer,
        isCorrect,
        explanation: q.explanation,
        expectedKeywords: q.expected_keywords,
      };
    });

    const correct = results.filter((r) => r.isCorrect).length;
    const score = Math.round((correct / questions.length) * 100);
    onDone(score, score >= 60, results);
  };

  const allAnswered = questions.every((_, i) => answers[i] !== undefined && answers[i] !== "");

  return (
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
                    answers[i] === oi
                      ? "border-primary bg-primary/10"
                      : "border-border/50 hover:border-border"
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
        className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow disabled:opacity-50 transition-all"
      >
        Enviar respostas
      </button>
    </motion.div>
  );
};

const QuizResultsStep = ({
  results,
  score,
  passed,
  xpReward,
  reviewMode,
  hasNext,
  onNext,
  onRetry,
  onRewatch,
  onBack,
}: {
  results: QuestionResult[];
  score: number;
  passed: boolean;
  xpReward: number;
  reviewMode: boolean;
  hasNext: boolean;
  onNext: () => void;
  onRetry: () => void;
  onRewatch: () => void;
  onBack: () => void;
}) => {
  const total = results.length;
  const correct = results.filter((r) => r.isCorrect).length;
  const wrong = total - correct;

  return (
    <motion.div
      key="quiz-results"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Header conquista / reforço */}
      <div
        className={`relative overflow-hidden rounded-2xl p-6 text-center space-y-3 border ${
          passed
            ? "border-green-500/30 bg-gradient-to-br from-green-500/15 via-emerald-500/5 to-transparent"
            : "border-amber-500/30 bg-gradient-to-br from-amber-500/15 via-orange-500/5 to-transparent"
        }`}
      >
        {passed && (
          <>
            {[...Array(10)].map((_, i) => (
              <motion.span
                key={i}
                initial={{ y: 0, x: 0, opacity: 1 }}
                animate={{
                  y: -40 - Math.random() * 40,
                  x: (Math.random() - 0.5) * 220,
                  opacity: 0,
                }}
                transition={{ duration: 1.6, delay: i * 0.06, repeat: Infinity, repeatDelay: 1.4 }}
                className="absolute left-1/2 top-12 w-2 h-2 rounded-full"
                style={{ background: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899"][i % 4] }}
              />
            ))}
          </>
        )}
        <motion.div
          initial={{ scale: 0.6, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 220, damping: 14 }}
          className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center shadow-glow ${
            passed ? "bg-gradient-to-br from-green-400 to-emerald-600" : "bg-gradient-to-br from-amber-400 to-orange-500"
          }`}
        >
          {passed ? <Trophy size={32} className="text-white" /> : <RefreshCw size={28} className="text-white" />}
        </motion.div>
        <div className="space-y-1">
          <h2 className="font-display text-xl font-bold">
            {passed ? (reviewMode ? "Boa revisão!" : "Aula concluída!") : "Quase lá!"}
          </h2>
          <p className="text-xs text-muted-foreground max-w-xs mx-auto">
            {passed
              ? reviewMode
                ? "Você mandou bem na revisão."
                : `Você dominou o conteúdo${!reviewMode ? ` e ganhou +${xpReward} XP` : ""}.`
              : "Você errou a maior parte das questões. Reassista a aula e tente novamente para avançar."}
          </p>
        </div>
        {total > 0 && (
          <div className="flex items-center justify-center gap-4 pt-1">
            <div className="text-center">
              <div className={`font-display text-3xl font-bold ${passed ? "text-green-500" : "text-amber-500"}`}>
                {correct}
                <span className="text-lg text-muted-foreground">/{total}</span>
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Acertos</div>
            </div>
            <div className="h-10 w-px bg-border/50" />
            <div className="text-center">
              <div className={`font-display text-3xl font-bold ${passed ? "text-green-500" : "text-amber-500"}`}>
                {score}%
              </div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Desempenho</div>
            </div>
          </div>
        )}
      </div>

      {/* Resumo acertos / erros */}
      {total > 0 && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 flex items-center gap-2">
            <CheckCircle2 size={20} className="text-green-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold text-green-500 leading-none">{correct}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Corretas</div>
            </div>
          </div>
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 flex items-center gap-2">
            <XCircle size={20} className="text-red-500 shrink-0" />
            <div className="min-w-0">
              <div className="text-lg font-bold text-red-500 leading-none">{wrong}</div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">Incorretas</div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback por questão */}
      {results.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">
            Revisão das respostas
          </h3>
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className={`rounded-xl p-3 border space-y-2 ${
                r.isCorrect
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-red-500/30 bg-red-500/5"
              }`}
            >
              <div className="flex items-start gap-2">
                <div className="shrink-0 mt-0.5">
                  {r.isCorrect ? (
                    <CheckCircle2 size={16} className="text-green-500" />
                  ) : (
                    <XCircle size={16} className="text-red-500" />
                  )}
                </div>
                <div className="min-w-0 flex-1 space-y-2">
                  <p className="text-sm font-medium leading-snug">
                    {i + 1}. {r.question}
                  </p>
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-muted-foreground">Sua resposta: </span>
                      <span className={r.isCorrect ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                        {r.userAnswer}
                      </span>
                    </div>
                    {!r.isCorrect && r.correctAnswer && (
                      <div>
                        <span className="text-muted-foreground">
                          {r.type === "open" ? "Palavras-chave esperadas: " : "Resposta correta: "}
                        </span>
                        <span className="text-green-500 font-medium">{r.correctAnswer}</span>
                      </div>
                    )}
                    {r.explanation && (
                      <div className="pt-1 text-muted-foreground italic">{r.explanation}</div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Ações */}
      <div className="space-y-2 pt-1">
        {passed ? (
          <>
            {hasNext ? (
              <button
                onClick={onNext}
                className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow flex items-center justify-center gap-2 transition-all"
              >
                Próxima aula <ArrowRight size={16} />
              </button>
            ) : (
              <button
                onClick={onBack}
                className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow transition-all"
              >
                Voltar à trilha
              </button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onRetry}
                className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <RotateCcw size={14} /> Refazer
              </button>
              <button
                onClick={onRewatch}
                className="py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-xs flex items-center justify-center gap-1.5 transition-all"
              >
                <Play size={14} /> Reassistir
              </button>
            </div>
          </>
        ) : (
          <>
            <button
              onClick={onRewatch}
              className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow flex items-center justify-center gap-2 transition-all"
            >
              <Play size={16} /> Reassistir aula agora
            </button>
            <button
              onClick={onRetry}
              className="w-full py-2.5 rounded-xl bg-secondary hover:bg-secondary/80 font-medium text-sm flex items-center justify-center gap-2 transition-all"
            >
              <RotateCcw size={14} /> Tentar quiz novamente
            </button>
            <button
              onClick={onBack}
              className="w-full py-2.5 rounded-xl bg-transparent hover:bg-secondary/40 text-muted-foreground font-medium text-xs transition-all"
            >
              Voltar à trilha
            </button>
          </>
        )}
        {passed && !reviewMode && (
          <button
            onClick={() => onBack()}
            className="w-full pt-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <Sparkles size={11} /> Voltar à trilha
          </button>
        )}
      </div>
    </motion.div>
  );
};

export default LessonPlayer;
