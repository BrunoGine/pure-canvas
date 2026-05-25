import { ReactNode, useEffect } from "react";
import { ShieldAlert, Ban, Trash2, LogOut } from "lucide-react";
import { useAccountStatus } from "@/hooks/useAccountStatus";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

const useStatusReason = (userId?: string) =>
  useQuery({
    queryKey: ["profile_status_reason", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("status_reason")
        .eq("id", userId!)
        .maybeSingle();
      return data?.status_reason ?? null;
    },
  });

const Screen = ({
  icon: Icon,
  tone,
  title,
  message,
  reason,
  showSupport = true,
  onSignOut,
}: {
  icon: any;
  tone: string;
  title: string;
  message: string;
  reason: string | null;
  showSupport?: boolean;
  onSignOut: () => void;
}) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md text-center space-y-5">
        <div className={`mx-auto h-16 w-16 rounded-full ${tone} flex items-center justify-center`}>
          <Icon className="h-8 w-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="text-muted-foreground">{message}</p>
        </div>
        {reason && (
          <div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-left text-sm">
            <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Motivo</p>
            <p>{reason}</p>
          </div>
        )}
        <div className="flex flex-col gap-2 pt-2">
          {showSupport && (
            <Button onClick={() => navigate("/suporte")} variant="outline">
              Falar com o suporte
            </Button>
          )}
          <Button onClick={onSignOut} variant="ghost">
            <LogOut className="mr-2 h-4 w-4" /> Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

const AccountStatusGate = ({ children }: { children: ReactNode }) => {
  const { user, signOut } = useAuth();
  const { data: status, isLoading } = useAccountStatus();
  const { data: reason } = useStatusReason(user?.id);

  useEffect(() => {
    if (status === "banned" || status === "deleted") {
      // For ban/delete we don't keep them inside the app at all.
      // Show screen first; user-initiated sign-out via button.
    }
  }, [status]);

  if (!user || isLoading || !status || status === "active") return <>{children}</>;

  if (status === "suspended") {
    return (
      <Screen
        icon={ShieldAlert}
        tone="bg-amber-500/15 text-amber-600"
        title="Conta suspensa"
        message="Seu acesso foi temporariamente pausado pela equipe administrativa."
        reason={reason ?? null}
        onSignOut={signOut}
      />
    );
  }
  if (status === "banned") {
    return (
      <Screen
        icon={Ban}
        tone="bg-destructive/15 text-destructive"
        title="Conta banida"
        message="Esta conta foi permanentemente bloqueada por violação dos termos de uso."
        reason={reason ?? null}
        onSignOut={signOut}
      />
    );
  }
  return (
    <Screen
      icon={Trash2}
      tone="bg-muted text-muted-foreground"
      title="Conta excluída"
      message="Esta conta foi marcada como excluída e não está mais ativa."
      reason={reason ?? null}
      showSupport={false}
      onSignOut={signOut}
    />
  );
};

export default AccountStatusGate;
