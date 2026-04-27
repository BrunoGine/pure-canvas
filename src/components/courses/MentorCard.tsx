import { useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Brain, MessageCircle, Loader2, X, Sparkles } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useMentorAdvice } from "@/hooks/useMentorAdvice";
import { supabase } from "@/integrations/supabase/client";
import ReactMarkdown from "react-markdown";
import { useToast } from "@/hooks/use-toast";

const MentorCard = () => {
  const navigate = useNavigate();
  const { data: advice, isLoading } = useMentorAdvice();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  const askMentor = async () => {
    setOpen(true);
    if (reply) return;
    setLoadingAi(true);
    try {
      const prompt = advice
        ? `Sou aluno do app Harp. Contexto atual: ${advice.message}. Me dê um conselho curto e prático (máximo 4 linhas) sobre meus próximos passos no estudo de finanças pessoais.`
        : "Me dê um conselho curto e prático sobre como organizar meus estudos de finanças pessoais.";
      const { data, error } = await supabase.functions.invoke("harp-ia-chat", {
        body: { messages: [{ role: "user", content: prompt }] },
      });
      if (error) throw error;
      setReply(data?.reply ?? "Sem resposta no momento.");
    } catch (e) {
      toast({ title: "Erro", description: "Mentor indisponível agora.", variant: "destructive" });
      setOpen(false);
    } finally {
      setLoadingAi(false);
    }
  };

  const handleCta = () => {
    if (advice?.cta?.lessonId) navigate(`/cursos/aula/${advice.cta.lessonId}`);
    else if (advice?.cta?.courseId) navigate(`/cursos/${advice.cta.courseId}`);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 relative overflow-hidden shadow-lg"
        style={{
          background:
            "linear-gradient(135deg, hsl(248 80% 60% / 0.18), hsl(280 70% 55% / 0.08), hsl(var(--card)))",
          border: "1px solid hsl(248 80% 60% / 0.25)",
        }}
      >
        <span
          aria-hidden="true"
          className="absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl opacity-30 pointer-events-none"
          style={{ background: "hsl(248 80% 60%)" }}
        />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
              style={{
                background: "linear-gradient(135deg, hsl(248 80% 60%), hsl(280 70% 55%))",
                boxShadow: "0 8px 20px -8px hsl(248 80% 60% / 0.6)",
              }}
            >
              <Brain size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-primary">Mentor IA</p>
              <p className="font-display text-base font-bold leading-tight">Sua dica de hoje</p>
            </div>
          </div>
          <p className="text-sm text-foreground/90 leading-relaxed mb-3 min-h-[40px]">
            {isLoading ? "Analisando seu progresso..." : advice?.message}
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={askMentor}
              className="flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-white text-sm font-medium shadow-glow hover:shadow-elevated transition-all flex items-center justify-center gap-1.5"
              style={{ background: "linear-gradient(135deg, hsl(248 80% 60%), hsl(280 70% 55%))" }}
            >
              <MessageCircle size={14} /> Pedir conselho ao mentor
            </button>
            {advice?.cta && (
              <button
                onClick={handleCta}
                className="py-2.5 px-3 rounded-xl bg-secondary hover:bg-secondary/80 text-sm font-medium flex items-center justify-center gap-1.5 transition-all"
              >
                <Sparkles size={14} /> {advice.cta.label}
              </button>
            )}
          </div>
        </div>
      </motion.div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain size={18} className="text-primary" /> Conselho do Mentor
            </DialogTitle>
          </DialogHeader>
          <div className="min-h-[120px]">
            {loadingAi ? (
              <div className="flex items-center justify-center gap-2 py-8 text-sm text-muted-foreground">
                <Loader2 className="animate-spin" size={16} /> Pensando...
              </div>
            ) : (
              <div className="prose prose-sm dark:prose-invert max-w-none [&_p]:text-sm">
                <ReactMarkdown>{reply ?? ""}</ReactMarkdown>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default MentorCard;
