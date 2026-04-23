import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface QuestionItem {
  type: "multiple_choice" | "open";
  question: string;
  options?: string[];
  correct_index?: number;
  expected_keywords?: string[];
}

const QuestionsEditor = ({
  value,
  onChange,
}: {
  value: QuestionItem[];
  onChange: (v: QuestionItem[]) => void;
}) => {
  const update = (i: number, patch: Partial<QuestionItem>) => {
    const next = [...value];
    next[i] = { ...next[i], ...patch } as QuestionItem;
    onChange(next);
  };

  const add = () => {
    onChange([
      ...value,
      { type: "multiple_choice", question: "", options: ["", "", "", ""], correct_index: 0 },
    ]);
  };

  const remove = (i: number) => onChange(value.filter((_, idx) => idx !== i));

  return (
    <div className="space-y-3">
      {value.length === 0 && (
        <p className="text-xs text-muted-foreground text-center py-3">Sem perguntas. Adicione abaixo ou gere com IA.</p>
      )}
      {value.map((q, i) => (
        <div key={i} className="rounded-lg border border-border/50 p-3 space-y-2 bg-secondary/20">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold">#{i + 1}</span>
            <select
              className="flex-1 rounded-md bg-background border border-border/50 p-1.5 text-xs"
              value={q.type}
              onChange={(e) => {
                const type = e.target.value as QuestionItem["type"];
                update(i, type === "multiple_choice"
                  ? { type, options: q.options ?? ["", "", "", ""], correct_index: q.correct_index ?? 0, expected_keywords: undefined }
                  : { type, options: undefined, correct_index: undefined, expected_keywords: q.expected_keywords ?? [] });
              }}
            >
              <option value="multiple_choice">Múltipla escolha</option>
              <option value="open">Aberta</option>
            </select>
            <button
              onClick={() => remove(i)}
              className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive"
              aria-label="Remover pergunta"
            >
              <Trash2 size={14} />
            </button>
          </div>
          <Textarea
            placeholder="Enunciado"
            value={q.question}
            onChange={(e) => update(i, { question: e.target.value })}
            rows={2}
          />
          {q.type === "multiple_choice" ? (
            <div className="space-y-1.5">
              {(q.options ?? []).map((opt, oi) => (
                <div key={oi} className="flex items-center gap-2">
                  <input
                    type="radio"
                    name={`correct-${i}`}
                    checked={q.correct_index === oi}
                    onChange={() => update(i, { correct_index: oi })}
                    aria-label={`Marcar opção ${oi + 1} como correta`}
                  />
                  <Input
                    placeholder={`Opção ${oi + 1}`}
                    value={opt}
                    onChange={(e) => {
                      const opts = [...(q.options ?? [])];
                      opts[oi] = e.target.value;
                      update(i, { options: opts });
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <Input
              placeholder="Palavras-chave esperadas (separadas por vírgula)"
              value={(q.expected_keywords ?? []).join(", ")}
              onChange={(e) =>
                update(i, {
                  expected_keywords: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
            />
          )}
        </div>
      ))}
      <Button variant="outline" size="sm" onClick={add} className="w-full">
        <Plus size={14} className="mr-1" /> Adicionar pergunta
      </Button>
    </div>
  );
};

export default QuestionsEditor;
