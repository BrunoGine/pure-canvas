import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const GoogleIcon = () => (
  <svg viewBox="0 0 48 48" className="w-4 h-4">
    <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/>
    <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16 19 13 24 13c3.1 0 5.8 1.1 7.9 3l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z"/>
    <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.6 39.6 16.3 44 24 44z"/>
    <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.1 5.6l6.2 5.2C41.8 35.6 44 30.2 44 24c0-1.3-.1-2.4-.4-3.5z"/>
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
    <path d="M16.365 1.43c0 1.14-.46 2.23-1.21 3.04-.81.86-2.13 1.52-3.21 1.43-.13-1.1.42-2.27 1.16-3.07.83-.9 2.24-1.55 3.26-1.4zM20.5 17.04c-.55 1.27-.81 1.83-1.51 2.95-.97 1.55-2.34 3.48-4.04 3.5-1.51.02-1.9-.99-3.94-.97-2.04.01-2.46 1-3.97.97-1.7-.02-3-1.77-3.97-3.32C.4 16.85.05 11.7 1.94 8.97c1.34-1.94 3.46-3.07 5.45-3.07 2.03 0 3.31 1.11 4.99 1.11 1.62 0 2.61-1.11 4.96-1.11 1.78 0 3.66.97 5 2.65-4.39 2.41-3.68 8.7.16 8.49z"/>
  </svg>
);

interface Props {
  mode?: "signin" | "signup";
}

const SocialAuthButtons = ({ mode = "signin" }: Props) => {
  const handle = async (provider: "google" | "apple") => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) toast.error(error.message);
  };

  const verb = mode === "signup" ? "Cadastrar" : "Continuar";

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="outline"
        className="w-full bg-secondary/30 border-border/50 hover:bg-secondary/60"
        onClick={() => handle("google")}
      >
        <GoogleIcon />
        {verb} com Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full bg-secondary/30 border-border/50 hover:bg-secondary/60"
        onClick={() => handle("apple")}
      >
        <AppleIcon />
        {verb} com Apple
      </Button>
    </div>
  );
};

export default SocialAuthButtons;
