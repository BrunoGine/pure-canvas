import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { pushProvider } from "@/lib/push";
import type { PushPermissionState } from "@/lib/push/types";
import { toast } from "sonner";

interface DeviceRow {
  id: string;
  token: string;
  platform: string;
  user_agent: string | null;
  created_at: string;
  last_seen_at: string;
}

export function usePushSubscription() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionState>(() =>
    pushProvider.isSupported() ? pushProvider.getPermission() : "unsupported"
  );
  const [isSubscribed, setIsSubscribed] = useState<boolean>(false);
  const [busy, setBusy] = useState(false);
  const [devices, setDevices] = useState<DeviceRow[]>([]);

  const refresh = useCallback(async () => {
    if (!user) return;
    setPermission(pushProvider.isSupported() ? pushProvider.getPermission() : "unsupported");
    const existing = await pushProvider.getExistingToken();
    setIsSubscribed(!!existing);
    const { data } = await (supabase as any)
      .from("notification_devices")
      .select("id, token, platform, user_agent, created_at, last_seen_at")
      .eq("user_id", user.id)
      .order("last_seen_at", { ascending: false });
    setDevices((data as DeviceRow[]) ?? []);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  const subscribe = useCallback(async () => {
    if (!user) return false;
    if (!pushProvider.isSupported()) {
      toast.error("Notificações não são suportadas neste dispositivo");
      return false;
    }
    setBusy(true);
    try {
      const perm = await pushProvider.requestPermission();
      setPermission(perm);
      if (perm !== "granted") {
        if (perm === "denied") toast.error("Permissão negada. Ative nas configurações do navegador.");
        return false;
      }
      const payload = await pushProvider.subscribe();
      const { error } = await (supabase as any).rpc("register_notification_device", {
        _provider: payload.provider,
        _token: payload.token,
        _p256dh: payload.p256dh ?? null,
        _auth: payload.auth ?? null,
        _platform: payload.platform,
        _user_agent: payload.userAgent ?? null,
      });
      if (error) throw error;
      setIsSubscribed(true);
      await refresh();
      toast.success("Notificações ativadas! 🔔");
      return true;
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Não foi possível ativar notificações");
      return false;
    } finally {
      setBusy(false);
    }
  }, [user, refresh]);

  const unsubscribe = useCallback(async () => {
    setBusy(true);
    try {
      const token = await pushProvider.unsubscribe();
      if (token) {
        await (supabase as any).rpc("unregister_notification_device", { _token: token });
      }
      setIsSubscribed(false);
      await refresh();
      toast.success("Notificações desativadas neste dispositivo");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao desativar");
    } finally {
      setBusy(false);
    }
  }, [refresh]);

  const removeDevice = useCallback(async (token: string) => {
    await (supabase as any).rpc("unregister_notification_device", { _token: token });
    await refresh();
    toast.success("Dispositivo removido");
  }, [refresh]);

  const sendTest = useCallback(async () => {
    if (!user) return;
    setBusy(true);
    try {
      // Call via authed function; we use a simple approach: invoke push-send is service-role only.
      // Instead, create a small "push-test" function trigger by calling notify-test edge function.
      const { error } = await supabase.functions.invoke("push-test", { body: {} });
      if (error) throw error;
      toast.success("Notificação de teste enviada");
    } catch (e: any) {
      toast.error(e?.message || "Falha no teste");
    } finally {
      setBusy(false);
    }
  }, [user]);

  return {
    supported: pushProvider.isSupported(),
    permission,
    isSubscribed,
    busy,
    devices,
    subscribe,
    unsubscribe,
    removeDevice,
    sendTest,
    refresh,
  };
}
