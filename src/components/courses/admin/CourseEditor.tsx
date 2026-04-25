import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAdminMutations, type CourseInput } from "@/hooks/useAdminMutations";

const empty: CourseInput = {
  title: "",
  description: "",
  level: "iniciante",
  order: 1,
  color: "#8A05BE",
  icon: "BookOpen",
};

const CourseEditor = ({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  initial?: CourseInput | null;
}) => {
  const [form, setForm] = useState<CourseInput>(empty);
  const { saveCourse } = useAdminMutations();

  useEffect(() => {
    if (!open) return;
    setForm(initial ?? empty);
  }, [open, initial?.id]);

  const submit = async () => {
    if (!form.title.trim()) return;
    await saveCourse.mutateAsync(form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar mundo" : "Novo mundo"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <Input placeholder="Título" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          <Textarea
            placeholder="Descrição"
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={2}
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              className="rounded-md bg-secondary/30 border border-border/50 p-2 text-sm"
              value={form.level}
              onChange={(e) => setForm({ ...form, level: e.target.value })}
            >
              <option value="iniciante">Iniciante</option>
              <option value="intermediario">Intermediário</option>
              <option value="avancado">Avançado</option>
            </select>
            <Input
              type="number"
              placeholder="Ordem"
              value={form.order}
              onChange={(e) => setForm({ ...form, order: parseInt(e.target.value) || 1 })}
            />
          </div>
          <Input placeholder="Ícone (Lucide name)" value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} />
          <div className="flex items-center gap-2">
            <Input placeholder="Cor (hex)" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} />
            <div className="w-10 h-10 rounded-lg border border-border/50 shrink-0" style={{ background: form.color }} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={submit} disabled={saveCourse.isPending}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEditor;
