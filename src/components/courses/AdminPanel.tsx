import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronLeft, Plus, Loader2, Pencil, Trash2, ChevronUp, ChevronDown, Globe, BookOpen } from "lucide-react";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { useCourses } from "@/hooks/useCourses";
import { useCourseLessons } from "@/hooks/useCourseLessons";
import { useAdminMutations, type CourseInput, type LessonInput } from "@/hooks/useAdminMutations";
import CourseEditor from "./admin/CourseEditor";
import LessonEditor from "./admin/LessonEditor";
import { Button } from "@/components/ui/button";

const AdminPanel = () => {
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: adminLoading } = useIsAdmin();
  const { data: courses } = useCourses();
  const [tab, setTab] = useState<"worlds" | "lessons">("worlds");
  const [selectedCourseId, setSelectedCourseId] = useState<string>("");

  const [courseEditorOpen, setCourseEditorOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<CourseInput | null>(null);
  const [lessonEditorOpen, setLessonEditorOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonInput | null>(null);

  const { data: lessonsData } = useCourseLessons(tab === "lessons" ? selectedCourseId : undefined);
  const { deleteCourse, deleteLesson, swapLessonOrder } = useAdminMutations();

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

  const lessons = lessonsData?.lessons ?? [];

  const openNewCourse = () => { setEditingCourse(null); setCourseEditorOpen(true); };
  const openEditCourse = (c: any) => {
    setEditingCourse({
      id: c.id, title: c.title, description: c.description ?? "",
      level: c.level, order: c.order, color: c.color, icon: c.icon,
    });
    setCourseEditorOpen(true);
  };
  const openNewLesson = () => {
    if (!selectedCourseId) return;
    setEditingLesson(null);
    setLessonEditorOpen(true);
  };
  const openEditLesson = (l: any) => {
    setEditingLesson({
      id: l.id, course_id: l.course_id, title: l.title, subtitle: l.subtitle ?? "",
      youtube_url: l.youtube_url, video_credit: l.video_credit ?? "",
      order: l.order, xp_reward: l.xp_reward,
      summary: l.summary ?? "", questions: l.questions ?? [],
    });
    setLessonEditorOpen(true);
  };

  const moveLesson = async (i: number, dir: -1 | 1) => {
    const a = lessons[i];
    const b = lessons[i + dir];
    if (!a || !b) return;
    await swapLessonOrder.mutateAsync({
      a: { id: a.id, order: a.order },
      b: { id: b.id, order: b.order },
      course_id: selectedCourseId,
    });
  };

  return (
    <div className="space-y-5 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2">
        <button onClick={() => navigate("/cursos")} className="p-1.5 rounded-full hover:bg-secondary"><ChevronLeft size={20} /></button>
        <h1 className="font-display text-xl font-bold flex-1">Painel Admin</h1>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border/50">
        <button
          onClick={() => setTab("worlds")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            tab === "worlds" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          <Globe size={14} /> Mundos
        </button>
        <button
          onClick={() => setTab("lessons")}
          className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors flex items-center gap-1.5 ${
            tab === "lessons" ? "border-primary text-primary" : "border-transparent text-muted-foreground"
          }`}
        >
          <BookOpen size={14} /> Aulas
        </button>
      </div>

      {tab === "worlds" && (
        <div className="space-y-3">
          <Button onClick={openNewCourse} className="w-full"><Plus size={14} className="mr-1" /> Novo mundo</Button>
          {(courses ?? []).map((c) => (
            <div key={c.id} className="glass-card rounded-xl p-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-lg shrink-0" style={{ background: c.color }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{c.title}</p>
                <p className="text-[11px] text-muted-foreground truncate">
                  {c.level} · ordem {c.order} · {c.completed_lessons}/{c.total_lessons} aulas
                </p>
              </div>
              <button onClick={() => openEditCourse(c)} className="p-2 rounded-md hover:bg-secondary" aria-label="Editar mundo">
                <Pencil size={14} />
              </button>
              <button
                onClick={() => {
                  if (confirm(`Excluir mundo "${c.title}"? As aulas associadas também serão excluídas.`)) {
                    deleteCourse.mutate(c.id);
                  }
                }}
                className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
                aria-label="Excluir mundo"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === "lessons" && (
        <div className="space-y-3">
          <select
            value={selectedCourseId}
            onChange={(e) => setSelectedCourseId(e.target.value)}
            className="w-full rounded-md bg-secondary/30 border border-border/50 p-2 text-sm"
          >
            <option value="">Selecione um mundo</option>
            {courses?.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>

          {selectedCourseId && (
            <>
              <Button onClick={openNewLesson} className="w-full"><Plus size={14} className="mr-1" /> Nova aula</Button>
              {lessons.length === 0 && (
                <p className="text-xs text-center text-muted-foreground py-4">Nenhuma aula neste mundo.</p>
              )}
              {lessons.map((l, i) => (
                <div key={l.id} className="glass-card rounded-xl p-3 flex items-center gap-2 shadow-sm">
                  <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                      onClick={() => moveLesson(i, -1)}
                      disabled={i === 0 || swapLessonOrder.isPending}
                      className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                      aria-label="Mover para cima"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => moveLesson(i, 1)}
                      disabled={i === lessons.length - 1 || swapLessonOrder.isPending}
                      className="p-1 rounded hover:bg-secondary disabled:opacity-30"
                      aria-label="Mover para baixo"
                    >
                      <ChevronDown size={14} />
                    </button>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{i + 1}. {l.title}</p>
                    <p className="text-[11px] text-muted-foreground truncate">
                      {l.xp_reward} XP{l.summary ? " · resumo ✓" : ""}{Array.isArray(l.questions) && l.questions.length ? ` · ${l.questions.length} perguntas` : ""}
                    </p>
                  </div>
                  <button onClick={() => openEditLesson(l)} className="p-2 rounded-md hover:bg-secondary" aria-label="Editar aula">
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Excluir aula "${l.title}"?`)) {
                        deleteLesson.mutate({ id: l.id, course_id: selectedCourseId });
                      }
                    }}
                    className="p-2 rounded-md hover:bg-destructive/10 text-destructive"
                    aria-label="Excluir aula"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      <CourseEditor open={courseEditorOpen} onOpenChange={setCourseEditorOpen} initial={editingCourse} />
      {selectedCourseId && (
        <LessonEditor
          open={lessonEditorOpen}
          onOpenChange={setLessonEditorOpen}
          initial={editingLesson}
          courseId={selectedCourseId}
        />
      )}
    </div>
  );
};

export default AdminPanel;
