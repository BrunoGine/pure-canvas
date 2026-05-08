import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import SocialAuthButtons from "./SocialAuthButtons";

interface Props {
  onBack: () => void;
  onLogin: () => void;
  onSuccess: () => void;
}

const errorMap: Record<string, string> = {
  "User already registered": "Este e-mail já está cadastrado",
  "Password should be at least 6 characters": "A senha deve ter no mínimo 6 caracteres",
};

const SignupCredentialsStep = ({ onBack, onLogin, onSuccess }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    setLoading(false);
    if (error) {
      toast({
        title: "Não foi possível criar a conta",
        description: errorMap[error.message] ?? error.message,
        variant: "destructive",
      });
      return;
    }
    if (data.session) {
      onSuccess();
    } else {
      toast({
        title: "Confirme seu e-mail",
        description: "Enviamos um link de confirmação. Após confirmar, faça login.",
      });
      onLogin();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 16 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -16 }}
      className="w-full max-w-sm"
    >
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-muted-foreground mb-6 hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-2xl font-display font-bold">Vamos começar</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Crie sua conta em poucos segundos.
          </p>
        </div>

        <SocialAuthButtons mode="signup" />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground">ou</span>
          <div className="h-px flex-1 bg-border/50" />
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary/30 border-border/50"
                required
                maxLength={255}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-10 pr-10 bg-secondary/30 border-border/50"
                required
                minLength={6}
                maxLength={128}
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-11 gradient-primary border-0 text-white shadow-glow"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <button onClick={onLogin} className="text-primary font-medium hover:underline">
            Entrar
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default SignupCredentialsStep;
