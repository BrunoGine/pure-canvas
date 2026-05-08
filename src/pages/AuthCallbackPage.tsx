import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const AuthCallbackPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const finish = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth", { replace: true });
        return;
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("onboarding_completed")
        .eq("id", session.user.id)
        .maybeSingle();
      if (profile?.onboarding_completed) {
        navigate("/", { replace: true });
      } else {
        navigate("/onboarding", { replace: true });
      }
    };
    // Give Supabase a tick to parse hash params
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
