import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCourses } from "@/hooks/useCourses";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";

const extractVideoId = (url: string): string | null => {
  const m = url.match(/(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/ ]{11})/);
  return m ? m[1] : null;
};

const AdminPanel = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: courses } = useCourses();

  const [courseForm, setCourseForm] = useState({ title: "", description: "", level: "iniciante", order: 1, color: "#8A05BE", icon: "BookOpen" });
  const [lessonForm, setLessonForm] = useState({ course_id: "", title: "", subtitle: "", youtube_url: "", order: 1, xp_reward: 50 });
  const [saving, setSaving] = useState(false);

  if (adminLoading) {
    return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-primary" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="space-y-4 pb-24">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate("/cursos")} className="p-1.5 rounded-full hover:bg-secondary"><ChevronLeft size={20} /></button>
          <h1 className="font-display text-xl font-bold">Acesso negado</h1>
        </div>
        <div className="glass-card rounded-xl p-6 text-center text-sm text-muted-foreground">
          Você não tem permissão de administrador.
        </div>
      </div>
    );
  }

  const createCourse = async () => {
    if (!courseForm.title) return;
    setSaving(true);
    const { error } = await (supabase as any).from("courses").insert(courseForm);
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Mundo criado" });
    setCourseForm({ title: "", description: "", level: "iniciante", order: 1, color: "#8A05BE", icon: "BookOpen" });
    qc.invalidateQueries({ queryKey: ["courses"] });
  };

  const createLesson = async () => {
    if (!lessonForm.course_id || !lessonForm.title || !lessonForm.youtube_url) return;
    const vid = extractVideoId(lessonForm.youtube_url);
    if (!vid) {
      toast({ title: "URL inválida", description: "Use uma URL do YouTube válida.", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await (supabase as any).from("lessons").insert({ ...lessonForm, youtube_video_id: vid });
    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Aula criada" });
    setLessonForm({ course_id: "", title: "", subtitle: "", youtube_url: "", order: 1, xp_reward: 50 });
    qc.invalidateQueries({ queryKey: ["courses"] });
    qc.invalidateQueries({ queryKey: ["course_lessons"] });
  };

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <button onClick={() => navigate("/cursos")} className="p-1.5 rounded-full hover:bg-secondary"><ChevronLeft size={20} /></button>
        <h1 className="font-display text-xl font-bold">Painel Admin</h1>
      </motion.div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold">Novo Mundo</h2>
        <Input placeholder="Título" value={courseForm.title} onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })} />
        <Input placeholder="Descrição" value={courseForm.description} onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <select className="rounded-md bg-secondary/30 border border-border/50 p-2 text-sm" value={courseForm.level} onChange={(e) => setCourseForm({ ...courseForm, level: e.target.value })}>
            <option value="iniciante">Iniciante</option>
            <option value="intermediario">Intermediário</option>
            <option value="avancado">Avançado</option>
          </select>
          <Input type="number" placeholder="Ordem" value={courseForm.order} onChange={(e) => setCourseForm({ ...courseForm, order: parseInt(e.target.value) || 1 })} />
        </div>
        <Input placeholder="Ícone (Lucide name)" value={courseForm.icon} onChange={(e) => setCourseForm({ ...courseForm, icon: e.target.value })} />
        <Input placeholder="Cor (hex)" value={courseForm.color} onChange={(e) => setCourseForm({ ...courseForm, color: e.target.value })} />
        <button onClick={createCourse} disabled={saving} className="w-full py-2 rounded-lg gradient-primary text-white text-sm font-medium flex items-center justify-center gap-1">
          <Plus size={14} /> Criar mundo
        </button>
      </div>

      <div className="glass-card rounded-xl p-4 space-y-3">
        <h2 className="text-sm font-semibold">Nova Aula</h2>
        <select className="w-full rounded-md bg-secondary/30 border border-border/50 p-2 text-sm" value={lessonForm.course_id} onChange={(e) => setLessonForm({ ...lessonForm, course_id: e.target.value })}>
          <option value="">Selecione um mundo</option>
          {courses?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <Input placeholder="Título" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })} />
        <Input placeholder="Subtítulo" value={lessonForm.subtitle} onChange={(e) => setLessonForm({ ...lessonForm, subtitle: e.target.value })} />
        <Input placeholder="URL do YouTube" value={lessonForm.youtube_url} onChange={(e) => setLessonForm({ ...lessonForm, youtube_url: e.target.value })} />
        <div className="grid grid-cols-2 gap-2">
          <Input type="number" placeholder="Ordem" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) || 1 })} />
          <Input type="number" placeholder="XP" value={lessonForm.xp_reward} onChange={(e) => setLessonForm({ ...lessonForm, xp_reward: parseInt(e.target.value) || 50 })} />
        </div>
        <button onClick={createLesson} disabled={saving} className="w-full py-2 rounded-lg gradient-primary text-white text-sm font-medium flex items-center justify-center gap-1">
          <Plus size={14} /> Criar aula
        </button>
      </div>
    </div>
  );
};

export default AdminPanel;
