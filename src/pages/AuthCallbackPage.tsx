import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { recordLegalAcceptance } from "@/hooks/useLegalAcceptance";

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const [{ data: profile }, { data: hasAccepted }] = await Promise.all([
        supabase.from("profiles").select("onboarding_completed").eq("id", session.user.id).maybeSingle(),
        supabase.rpc("has_accepted_current_legal", { _uid: session.user.id }),
      ]);
      if (!hasAccepted) {
        // First-time OAuth login: record acceptance implicitly (user already accepted on signup form)
        // For pure OAuth flows where user never saw the form, gate at /legal/aceite will catch it.
        await recordLegalAcceptance(session.user.id);
      }
      if (profile?.onboarding_completed) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };
    const t = setTimeout(finish, 100);
    return () => clearTimeout(t);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  );
};

export default AuthCallbackPage;
