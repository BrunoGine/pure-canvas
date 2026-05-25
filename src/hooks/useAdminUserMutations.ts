import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { AccountStatus } from "@/components/admin/UserStatusBadge";

const invalidate = (qc: ReturnType<typeof useQueryClient>, userId?: string) => {
  qc.invalidateQueries({ queryKey: ["admin_users"] });
  qc.invalidateQueries({ queryKey: ["admin_metrics"] });
  qc.invalidateQueries({ queryKey: ["admin_logs"] });
  if (userId) qc.invalidateQueries({ queryKey: ["admin_user_detail", userId] });
};

export const useAdminUserMutations = () => {
  const qc = useQueryClient();
  const { toast } = useToast();

  const setStatus = useMutation({
    mutationFn: async ({ userId, status, reason }: { userId: string; status: AccountStatus; reason?: string }) => {
      const { error } = await (supabase as any).rpc("admin_set_account_status", {
        _user_id: userId,
        _status: status,
        _reason: reason ?? null,
      });
      if (error) throw error;
      // revoke sessions when suspending/banning/deleting
      if (status !== "active") {
        await supabase.functions.invoke("admin-user-actions", {
          body: { action: "revoke_sessions", user_id: userId, reason: reason ?? null },
        });
      }
    },
    onSuccess: (_d, v) => {
      toast({ title: "Status atualizado" });
      invalidate(qc, v.userId);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const hardDelete = useMutation({
    mutationFn: async ({ userId, reason }: { userId: string; reason?: string }) => {
      const { error, data } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "hard_delete", user_id: userId, reason: reason ?? null },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: (_d, v) => {
      toast({ title: "Conta excluída permanentemente" });
      invalidate(qc, v.userId);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const revokeSessions = useMutation({
    mutationFn: async ({ userId }: { userId: string }) => {
      const { error, data } = await supabase.functions.invoke("admin-user-actions", {
        body: { action: "revoke_sessions", user_id: userId },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
    },
    onSuccess: (_d, v) => {
      toast({ title: "Sessões revogadas" });
      invalidate(qc, v.userId);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const grantOverride = useMutation({
    mutationFn: async (input: { userId: string; plan: "premium" | "enterprise"; durationDays: number | null; reason: string }) => {
      const { error } = await (supabase as any).rpc("admin_grant_override", {
        _user_id: input.userId,
        _plan: input.plan,
        _duration_days: input.durationDays,
        _reason: input.reason,
      });
      if (error) throw error;
    },
    onSuccess: (_d, v) => {
      toast({ title: "Cortesia concedida" });
      invalidate(qc, v.userId);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const revokeOverride = useMutation({
    mutationFn: async ({ overrideId, userId }: { overrideId: string; userId: string }) => {
      const { error } = await (supabase as any).rpc("admin_revoke_override", { _override_id: overrideId });
      if (error) throw error;
      return userId;
    },
    onSuccess: (userId) => {
      toast({ title: "Cortesia revogada" });
      invalidate(qc, userId);
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  return { setStatus, hardDelete, revokeSessions, grantOverride, revokeOverride };
};
