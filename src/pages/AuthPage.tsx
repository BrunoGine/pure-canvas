import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import WelcomeScreen from "@/components/auth/WelcomeScreen";
import LoginForm from "@/components/auth/LoginForm";
import ForgotPasswordForm from "@/components/auth/ForgotPasswordForm";
import SignupCredentialsStep from "@/components/auth/SignupCredentialsStep";

type View = "welcome" | "login" | "forgot" | "signup";

const AuthPage = () => {
  const [view, setView] = useState<View>("welcome");

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 ambient-glow overflow-hidden">
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full bg-primary/8 blur-[100px] pointer-events-none" />

      <div className="w-full flex flex-col items-center relative z-10">
        <AnimatePresence mode="wait">
          {view === "welcome" && (
            <WelcomeScreen
              key="welcome"
              onLogin={() => setView("login")}
              onSignup={() => setView("signup")}
            />
          )}
          {view === "login" && (
            <LoginForm
              key="login"
              onBack={() => setView("welcome")}
              onForgot={() => setView("forgot")}
              onSignup={() => setView("signup")}
            />
          )}
          {view === "forgot" && (
            <ForgotPasswordForm key="forgot" onBack={() => setView("login")} />
          )}
          {view === "signup" && (
            <SignupCredentialsStep
              key="signup"
              onBack={() => setView("welcome")}
              onLogin={() => setView("login")}
              onSuccess={() => {
                /* AuthContext + ProtectedRoutes will redirect to onboarding */
              }}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AuthPage;
