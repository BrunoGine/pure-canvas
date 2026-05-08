import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import logoWhite from "@/assets/logo-white.png";
import logoDark from "@/assets/logo-dark.png";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  onLogin: () => void;
  onSignup: () => void;
}

const WelcomeScreen = ({ onLogin, onSignup }: Props) => {
  const { theme } = useTheme();
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-sm flex flex-col items-center text-center gap-8"
    >
      <img
        src={theme === "dark" ? logoWhite : logoDark}
        alt="Harpy"
        className="w-28 h-28 drop-shadow-lg"
      />
      <div className="space-y-3">
        <h1 className="text-3xl font-display font-bold leading-tight">
          Sua vida financeira,<br />mais leve.
        </h1>
        <p className="text-muted-foreground text-base">
          Organize, aprenda e conquiste seus objetivos no seu ritmo.
        </p>
      </div>

      <div className="w-full space-y-3 pt-4">
        <Button
          onClick={onSignup}
          className="w-full h-12 gradient-primary border-0 text-white shadow-glow hover:shadow-elevated text-base"
        >
          Criar conta
          <ArrowRight className="w-4 h-4" />
        </Button>
        <Button
          onClick={onLogin}
          variant="outline"
          className="w-full h-12 bg-secondary/30 border-border/50 hover:bg-secondary/60 text-base"
        >
          Já tenho conta
        </Button>
      </div>
    </motion.div>
  );
};

export default WelcomeScreen;
