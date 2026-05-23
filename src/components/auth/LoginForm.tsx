import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { setRememberMe } from "@/lib/secureStorage";



interface Props {
  onBack: () => void;
  onForgot: () => void;
  onSignup: () => void;
}

const errorMap: Record<string, string> = {
  "Invalid login credentials": "E-mail ou senha incorretos",
  "Email not confirmed": "Confirme seu e-mail antes de entrar",
};

const LoginForm = ({ onBack, onForgot, onSignup }: Props) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      toast({
        title: "Não foi possível entrar",
        description: errorMap[error.message] ?? "Tente novamente em instantes.",
        variant: "destructive",
      });
      return;
    }
    toast({ title: "Bem-vindo de volta! 👋" });
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
          <h2 className="text-2xl font-display font-bold">Entrar</h2>
          <p className="text-sm text-muted-foreground mt-1">Bom te ver de novo.</p>
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
                placeholder="Sua senha"
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
            <button
              type="button"
              onClick={onForgot}
              className="text-xs text-primary hover:underline mt-1"
            >
              Esqueci minha senha
            </button>
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
          Ainda não tem conta?{" "}
          <button onClick={onSignup} className="text-primary font-medium hover:underline">
            Criar conta
          </button>
        </p>
      </div>
    </motion.div>
  );
};

export default LoginForm;
