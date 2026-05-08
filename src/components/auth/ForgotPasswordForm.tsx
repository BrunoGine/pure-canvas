import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Mail, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Props {
  onBack: () => void;
}

const ForgotPasswordForm = ({ onBack }: Props) => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    setSent(true);
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
          <h2 className="text-2xl font-display font-bold">Recuperar senha</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Vamos enviar um link para o seu e-mail.
          </p>
        </div>

        {sent ? (
          <div className="text-center space-y-3 py-4">
            <div className="w-12 h-12 mx-auto rounded-full bg-primary/10 flex items-center justify-center text-primary">
              <Check className="w-6 h-6" />
            </div>
            <p className="text-sm">
              Se existir uma conta com <strong>{email}</strong>, o link chegará em alguns
              instantes. Verifique sua caixa de entrada e o spam.
            </p>
            <Button onClick={onBack} variant="outline" className="w-full">
              Voltar para o login
            </Button>
          </div>
        ) : (
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
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-11 gradient-primary border-0 text-white shadow-glow"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  Enviar link
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>
        )}
      </div>
    </motion.div>
  );
};

export default ForgotPasswordForm;
