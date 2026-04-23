import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, Play, FileText, HelpCircle, Trophy, Sparkles, Loader2, RotateCcw, Youtube } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";
import { useLessonProgress } from "@/hooks/useLessonProgress";
import { useUserStats } from "@/hooks/useUserStats";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useQueryClient } from "@tanstack/react-query";

interface Question {
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  expected_keywords?: string[];
}

const LessonPlayer = () => {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { upsert, data: progress } = useLessonProgress(lessonId);
  const { awardXp, updateStreak } = useUserStats();
  const [step, setStep] = useState<number>(-1); // -1 = unset, 4 = review menu
  const [reviewMode, setReviewMode] = useState(false);

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
      // +5 XP once per day per lesson
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

  const finishLesson = async (score: number, passed: boolean) => {
    if (reviewMode) {
      // Apenas atualiza score se for melhor; não mexe em streak nem completed
      const bestScore = Math.max(progress?.score ?? 0, score);
      if (bestScore !== (progress?.score ?? 0)) {
        await upsert.mutateAsync({ score: bestScore });
      }
      if (passed) {
        await awardXp.mutateAsync(10);
        toast({ title: "+10 XP ⚡", description: "Modo revisão — XP reduzido" });
      } else {
        toast({ title: "Continue praticando!", description: `Score: ${score}%` });
      }
      qc.invalidateQueries({ queryKey: ["course_lessons"] });
      setStep(3);
      return;
    }
    const xpReward = lesson?.xp_reward ?? 50;
    const bonus = passed ? xpReward : Math.floor(xpReward / 2);
    await upsert.mutateAsync({
      questions_passed: passed,
      score,
      completed: true,
      completed_at: new Date().toISOString(),
    });
    await awardXp.mutateAsync(bonus);
    await updateStreak.mutateAsync();
    qc.invalidateQueries({ queryKey: ["course_lessons"] });
    qc.invalidateQueries({ queryKey: ["courses"] });
    toast({ title: `+${bonus} XP ⚡`, description: passed ? "Aula concluída!" : "Boa! Continue praticando." });
    setStep(3);
  };

  const startReview = (mode: "video" | "quiz") => {
    setReviewMode(true);
    setStep(mode === "video" ? 0 : 2);
    if (mode === "quiz" && !aiContent && !aiLoading) refetchAi();
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

      {/* Stepper (only when not in review menu) */}
      {step !== 4 && (
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
            questions={(aiContent?.questions ?? lesson.questions ?? []) as Question[]}
            onDone={finishLesson}
            loading={aiLoading}
          />
        )}

        {step === 3 && (
          <CompletionStep
            lesson={lesson}
            score={progress?.score ?? 0}
            navigate={navigate}
            reviewMode={reviewMode}
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
  onDone: (score: number, passed: boolean) => void;
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
          onClick={() => onDone(0, true)}
          className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow"
        >
          Concluir aula
        </button>
      </motion.div>
    );
  }

  const submit = () => {
    let correct = 0;
    questions.forEach((q, i) => {
      const ans = answers[i];
      if (q.type === "multiple_choice" && typeof ans === "number" && ans === q.correct_index) correct++;
      if (q.type === "open" && typeof ans === "string" && ans.trim().length > 5) {
        const lower = ans.toLowerCase();
        const hit = (q.expected_keywords ?? []).some((k) => lower.includes(k.toLowerCase()));
        if (hit || ans.trim().length > 30) correct++;
      }
    });
    const score = Math.round((correct / questions.length) * 100);
    onDone(score, score >= 60);
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

const CompletionStep = ({ lesson, score, navigate, reviewMode }: any) => {
  return (
    <motion.div
      key="done"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card rounded-2xl p-6 text-center space-y-4"
    >
      <div className="relative h-24">
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center shadow-glow"
          >
            <Trophy size={40} className="text-white" />
          </motion.div>
        </div>
        {!reviewMode && [...Array(12)].map((_, i) => (
          <motion.span
            key={i}
            initial={{ y: 0, x: 0, opacity: 1 }}
            animate={{ y: -50 - Math.random() * 30, x: (Math.random() - 0.5) * 200, opacity: 0 }}
            transition={{ duration: 1.6, delay: i * 0.05, repeat: Infinity, repeatDelay: 1 }}
            className="absolute left-1/2 top-1/2 w-2 h-2 rounded-full"
            style={{ background: ["#F59E0B", "#10B981", "#3B82F6", "#EC4899"][i % 4] }}
          />
        ))}
      </div>
      <h2 className="font-display text-xl font-bold">
        {reviewMode ? "Revisão concluída!" : "Aula concluída!"}
      </h2>
      <p className="text-sm text-muted-foreground">
        {reviewMode ? (
          <>Score: <span className="text-primary font-semibold">{score}%</span></>
        ) : (
          <>Você ganhou <span className="text-primary font-semibold">+{lesson.xp_reward} XP</span>{score > 0 && <> com {score}% de acertos</>}.</>
        )}
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => navigate(`/cursos/${lesson.course_id}`)}
          className="flex-1 py-3 rounded-xl bg-secondary font-medium text-sm hover:bg-secondary/80 transition-all"
        >
          Voltar à trilha
        </button>
        <button
          onClick={() =>
            navigate("/chat", {
              state: {
                lessonContext: {
                  lesson_id: lesson.id,
                  lesson_title: lesson.title,
                  youtube_url: lesson.youtube_url,
                },
              },
            })
          }
          className="flex-1 py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow flex items-center justify-center gap-1.5"
        >
          <Sparkles size={14} /> Treinar mais
        </button>
      </div>
    </motion.div>
  );
};

export default LessonPlayer;
