import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";

const FN_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/handle-email-unsubscribe`;
const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

type State = "validating" | "valid" | "already" | "invalid" | "confirming" | "done" | "error";

const UnsubscribePage = () => {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const [state, setState] = useState<State>("validating");
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!token) { setState("invalid"); return; }
    fetch(`${FN_URL}?token=${encodeURIComponent(token)}`, { headers: { apikey: ANON } })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (r.ok && data.valid) { setEmail(data.email || null); setState("valid"); }
        else if (data.already_unsubscribed) setState("already");
        else setState("invalid");
      })
      .catch(() => setState("error"));
  }, [token]);

  const confirm = async () => {
    setState("confirming");
    try {
      const r = await fetch(FN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: ANON },
        body: JSON.stringify({ token }),
      });
      setState(r.ok ? "done" : "error");
    } catch { setState("error"); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="glass-card rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        {state === "validating" && (<><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /><p>Validando link...</p></>)}
        {state === "valid" && (<>
          <h1 className="text-xl font-display font-bold">Cancelar inscrição de emails</h1>
          <p className="text-sm text-muted-foreground">Você não receberá mais emails de notificações{email ? ` em ${email}` : ""}. Emails essenciais de conta (autenticação) continuarão sendo enviados.</p>
          <Button onClick={confirm} className="w-full">Confirmar cancelamento</Button>
        </>)}
        {state === "confirming" && (<><Loader2 className="w-8 h-8 mx-auto animate-spin text-primary" /><p>Processando...</p></>)}
        {state === "done" && (<><CheckCircle2 className="w-10 h-10 mx-auto text-primary" /><h1 className="text-xl font-display font-bold">Inscrição cancelada</h1><p className="text-sm text-muted-foreground">Pronto! Você não receberá mais esses emails.</p></>)}
        {state === "already" && (<><CheckCircle2 className="w-10 h-10 mx-auto text-muted-foreground" /><p>Você já havia cancelado a inscrição.</p></>)}
        {state === "invalid" && (<><AlertCircle className="w-10 h-10 mx-auto text-destructive" /><p>Link inválido ou expirado.</p></>)}
        {state === "error" && (<><AlertCircle className="w-10 h-10 mx-auto text-destructive" /><p>Algo deu errado. Tente novamente mais tarde.</p></>)}
      </div>
    </div>
  );
};

export default UnsubscribePage;
