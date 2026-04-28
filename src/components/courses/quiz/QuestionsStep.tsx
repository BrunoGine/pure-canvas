import { useState } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

export interface Question {
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  expected_keywords?: string[];
  explanation?: string;
  // Optional metadata for exam mode (origin lesson/course)
  source_lesson_id?: string;
  source_course_id?: string;
  source_topic?: string;
}

export interface QuestionResult {
  question: string;
  type: "multiple_choice" | "open";
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
  expectedKeywords?: string[];
  source_lesson_id?: string;
  source_course_id?: string;
  source_topic?: string;
}

export const evaluateAnswers = (
  questions: Question[],
  answers: Record<number, string | number>,
): QuestionResult[] =>
  questions.map((q, i) => {
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
      source_lesson_id: q.source_lesson_id,
      source_course_id: q.source_course_id,
      source_topic: q.source_topic,
    };
  });

interface QuestionsStepProps {
  questions: Question[];
  loading?: boolean;
  onDone: (score: number, passed: boolean, results: QuestionResult[]) => void;
  /** Score threshold to mark passed (default 60) */
  passThreshold?: number;
  /** Override label of the submit button */
  submitLabel?: string;
}

const QuestionsStep = ({ questions, onDone, loading, passThreshold = 60, submitLabel = "Enviar respostas" }: QuestionsStepProps) => {
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
          Nenhuma pergunta disponível.
        </div>
        <button
          onClick={() => onDone(100, true, [])}
          className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow"
        >
          Concluir
        </button>
      </motion.div>
    );
  }

  const submit = () => {
    const results = evaluateAnswers(questions, answers);
    const correct = results.filter((r) => r.isCorrect).length;
    const score = Math.round((correct / questions.length) * 100);
    onDone(score, score >= passThreshold, results);
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
        className="w-full py-3 rounded-xl gradient-primary text-white font-medium text-sm shadow-glow disabled:opacity-50 transition-all"
      >
        {submitLabel}
      </button>
    </motion.div>
  );
};

export default QuestionsStep;
