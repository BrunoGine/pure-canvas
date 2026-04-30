import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Target } from "lucide-react";
import { useGoals, type Goal } from "@/hooks/useGoals";
import GoalCard from "./GoalCard";
import GoalFormDialog from "./GoalFormDialog";
import GoalContributeDialog from "./GoalContributeDialog";
import GoalWithdrawDialog from "./GoalWithdrawDialog";
import GoalCompletedDialog from "./GoalCompletedDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const GoalsSection = () => {
  const {
    goals,
    addGoal,
    contributeToGoal,
    withdrawFromGoal,
    deleteGoal,
    justCompleted,
    dismissCompleted,
  } = useGoals();

  const [formOpen, setFormOpen] = useState(false);
  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  const [withdrawGoal, setWithdrawGoal] = useState<Goal | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Goal | null>(null);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Target size={18} className="text-primary" /> Minhas Metas
        </h2>
        <button
          onClick={() => setFormOpen(true)}
          className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
        >
          <Plus size={14} /> Nova
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <Target size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Você ainda não tem metas. Crie sua primeira para começar a guardar dinheiro 🎯
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {goals.map((g) => (
            <GoalCard
              key={g.id}
              goal={g}
              onContribute={(goal) => setContribGoal(goal)}
              onWithdraw={(goal) => setWithdrawGoal(goal)}
              onDelete={(goal) => setDeleteTarget(goal)}
            />
          ))}
        </div>
      )}

      <GoalFormDialog open={formOpen} onOpenChange={setFormOpen} onCreate={addGoal} />
      <GoalContributeDialog
        open={!!contribGoal}
        goal={contribGoal}
        onOpenChange={(v) => !v && setContribGoal(null)}
        onConfirm={contributeToGoal}
      />
      <GoalWithdrawDialog
        open={!!withdrawGoal}
        goal={withdrawGoal}
        onOpenChange={(v) => !v && setWithdrawGoal(null)}
        onConfirm={withdrawFromGoal}
      />
      <GoalCompletedDialog goal={justCompleted} onClose={dismissCompleted} />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent className="glass-card border-border/30">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir meta?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget && Number(deleteTarget.current_amount) > 0
                ? `O valor acumulado de R$ ${Number(deleteTarget.current_amount).toLocaleString("pt-BR", { minimumFractionDigits: 2 })} será devolvido como entrada nas suas transações.`
                : "Esta ação não pode ser desfeita."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deleteTarget) await deleteGoal(deleteTarget);
                setDeleteTarget(null);
              }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.section>
  );
};

export default GoalsSection;
