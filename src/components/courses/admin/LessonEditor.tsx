import { useEffect, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAdminMutations, type LessonInput } from "@/hooks/useAdminMutations";
import QuestionsEditor, { type QuestionItem } from "./QuestionsEditor";
import { useToast } from "@/hooks/use-toast";

const empty: LessonInput = {
  course_id: "",
  title: "",
  subtitle: "",
  youtube_url: "",
  video_credit: "",
  order: 1,
  xp_reward: 50,
  summary: "",
  questions: [],
};

const LessonEditor = ({
  open,
  onOpenChange,
  initial,
  courseId,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: LessonInput | null;
  courseId: string;
}) => {
  const [form, setForm] = useState<LessonInput>(empty);
  const [tab, setTab] = useState<"info" | "summary" | "questions">("info");
  const { saveLesson, generateAiContent } = useAdminMutations();
  const { toast } = useToast();

  useEffect(() => {
    setForm(initial ? { ...empty, ...initial, course_id: initial.course_id || courseId } : { ...empty, course_id: courseId });
    setTab("info");
  }, [initial, open, courseId]);

  const submit = async () => {
    if (!form.title.trim() || !form.youtube_url.trim()) {
      toast({ title: "Preencha título e URL do vídeo", variant: "destructive" });
      return;
    }
    await saveLesson.mutateAsync(form);
    onOpenChange(false);
  };

  const generateAi = async () => {
    if (!initial?.id) {
      toast({ title: "Salve a aula primeiro", description: "É preciso salvar antes de gerar conteúdo IA." });
      return;
    }
    const result = await generateAiContent.mutateAsync(initial.id);
    setForm((f) => ({
      ...f,
      summary: result.summary ?? f.summary,
      questions: result.questions ?? f.questions,
    }));
    toast({ title: "Conteúdo gerado", description: "Revise e clique em Salvar." });
  };

  const questions = Array.isArray(form.questions) ? (form.questions as QuestionItem[]) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar aula" : "Nova aula"}</DialogTitle>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border/50">
          {[
            { k: "info", label: "Informações" },
            { k: "summary", label: "Resumo" },
            { k: "questions", label: "Perguntas" },
          ].map((t) => (
            <button
              key={t.k}
              onClick={() => setTab(t.k as any)}
              className={`px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.k ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "info" && (
          <div className="space-y-3">
            <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            <Input placeholder="Subtítulo" value={form.subtitle ?? ""} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} />
            <Input placeholder="URL do YouTube" value={form.youtube_url} onChange={(e) => setForm({ ...form, youtube_url: e.target.value })} />
            <Input
              placeholder="Crédito do vídeo (opcional, ex: Canal Me Poupe)"
              value={form.video_credit ?? ""}
              onChange={(e) => setForm({ ...form, video_credit: e.target.value })}
            />
            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                placeholder="Ordem"
                value={form.order}
                onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
              />
              <Input
                type="number"
                placeholder="XP"
                value={form.xp_reward}
                onChange={(e) => setForm({ ...form, xp_reward: parseInt(e.target.value) || 50 })}
              />
            </div>
          </div>
        )}

        {tab === "summary" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Markdown suportado.</p>
              <Button variant="outline" size="sm" onClick={generateAi} disabled={generateAiContent.isPending}>
                {generateAiContent.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                Gerar com IA
              </Button>
            </div>
            <Textarea
              placeholder="Resumo da aula..."
              value={form.summary ?? ""}
              onChange={(e) => setForm({ ...form, summary: e.target.value })}
              rows={14}
              className="font-mono text-xs"
            />
          </div>
        )}

        {tab === "questions" && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{questions.length} pergunta(s)</p>
              <Button variant="outline" size="sm" onClick={generateAi} disabled={generateAiContent.isPending}>
                {generateAiContent.isPending ? <Loader2 size={12} className="animate-spin mr-1" /> : <Sparkles size={12} className="mr-1" />}
                Gerar com IA
              </Button>
            </div>
            <QuestionsEditor value={questions} onChange={(q) => setForm({ ...form, questions: q })} />
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saveLesson.isPending}>
            {saveLesson.isPending && <Loader2 size={12} className="animate-spin mr-1" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default LessonEditor;
