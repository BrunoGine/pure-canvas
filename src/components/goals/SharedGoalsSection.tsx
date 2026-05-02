import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Users, Plus, KeyRound } from "lucide-react";
import confetti from "canvas-confetti";
import { useSharedGoals, type SharedGoalSummary } from "@/hooks/useSharedGoals";
import SharedGoalCard from "./SharedGoalCard";
import CreateSharedGoalDialog from "./CreateSharedGoalDialog";
import JoinSharedGoalDialog from "./JoinSharedGoalDialog";
import SharedGoalDetailDialog from "./SharedGoalDetailDialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const SharedGoalsSection = () => {
  const sg = useSharedGoals();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [active, setActive] = useState<SharedGoalSummary | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (sg.justCompleted) {
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });
    }
  }, [sg.justCompleted]);

  // Re-sync active goal when list refreshes
  useEffect(() => {
    if (active) {
      const updated = sg.goals.find((g) => g.id === active.id);
      if (updated) setActive(updated);
    }
  }, [sg.goals, active]);

  const totalPending = sg.goals.reduce((s, g) => s + g.pending_count, 0);

  return (
    <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-display text-lg font-semibold flex items-center gap-2">
          <Users size={18} className="text-primary" /> Metas Compartilhadas
          {totalPending > 0 && (
            <span className="bg-destructive text-destructive-foreground text-[10px] rounded-full px-2 py-0.5 font-bold">
              {totalPending}
            </span>
          )}
        </h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setJoinOpen(true)}
            className="text-muted-foreground text-xs font-medium flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <KeyRound size={14} /> Código
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="text-primary text-xs font-medium flex items-center gap-1 hover:gap-2 transition-all"
          >
            <Plus size={14} /> Vaquinha
          </button>
        </div>
      </div>

      {sg.goals.length === 0 ? (
        <div className="glass-card rounded-xl p-6 text-center">
          <Users size={28} className="mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Crie uma vaquinha ou entre em uma com o código de convite 👥
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sg.goals.map((g) => (
            <SharedGoalCard key={g.id} goal={g} onOpen={setActive} />
          ))}
        </div>
      )}

      <CreateSharedGoalDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={async (input) => {
          const r = await sg.createSharedGoal(input);
          setRefreshKey((k) => k + 1);
          return r;
        }}
      />
      <JoinSharedGoalDialog open={joinOpen} onOpenChange={setJoinOpen} onJoin={sg.joinByCode} />

      <SharedGoalDetailDialog
        goal={active}
        onOpenChange={(v) => !v && setActive(null)}
        actions={{
          requestContribution: sg.requestContribution,
          withdrawFromShared: sg.withdrawFromShared,
          approveJoinRequest: sg.approveJoinRequest,
          rejectJoinRequest: sg.rejectJoinRequest,
          approveContribution: sg.approveContribution,
          rejectContribution: sg.rejectContribution,
          removeMember: sg.removeMember,
          promoteMember: sg.promoteMember,
          deleteSharedGoal: sg.deleteSharedGoal,
        }}
        refreshKey={refreshKey}
      />

      <Dialog open={!!sg.justCompleted} onOpenChange={(v) => !v && sg.dismissCompleted()}>
        <DialogContent className="glass-card border-border/30 text-center">
          <DialogHeader>
            <DialogTitle className="text-2xl">🎉 Vaquinha concluída!</DialogTitle>
            <DialogDescription>
              {sg.justCompleted?.name} atingiu o objetivo. Avise os participantes!
            </DialogDescription>
          </DialogHeader>
          <Button onClick={sg.dismissCompleted} className="gradient-primary text-white border-0 mt-2">
            Comemorar 🥳
          </Button>
        </DialogContent>
      </Dialog>
    </motion.section>
  );
};

export default SharedGoalsSection;
