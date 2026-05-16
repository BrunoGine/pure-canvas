import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { CompanyProvider } from "@/contexts/CompanyContext";
import { supabase } from "@/integrations/supabase/client";
import Index from "./pages/Index.tsx";
import AuthPage from "./pages/AuthPage.tsx";
import AuthCallbackPage from "./pages/AuthCallbackPage.tsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.tsx";
import OnboardingPage from "./pages/OnboardingPage.tsx";
import BusinessOnboardingPage from "./pages/BusinessOnboardingPage.tsx";
import PricingPage from "./pages/PricingPage.tsx";
import { PaywallProvider } from "@/contexts/PaywallContext";

const queryClient = new QueryClient();

const Spinner = () => (
  <div className="min-h-screen bg-background flex items-center justify-center">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
);

const ProtectedRoutes = () => {
  const { session, loading } = useAuth();
  const location = useLocation();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);

  useEffect(() => {
    if (!session) {
      setOnboardingDone(null);
      return;
    }
    supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data }) => setOnboardingDone(!!data?.onboarding_completed));
  }, [session, location.pathname]);

  if (loading) return <Spinner />;
  if (!session) return <Navigate to="/auth" replace />;
  if (onboardingDone === null) return <Spinner />;
  if (!onboardingDone && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }
  if (onboardingDone && location.pathname === "/onboarding") {
    return <Navigate to="/" replace />;
  }
  if (location.pathname === "/onboarding") return <OnboardingPage />;
  if (location.pathname === "/empresa/onboarding") return <BusinessOnboardingPage />;
  if (location.pathname === "/planos") return <PricingPage />;
  return <Index />;
};

const AuthPageWrapper = () => {
  const { session, loading } = useAuth();
  if (loading) return <Spinner />;
  if (session) return <Navigate to="/" replace />;
  return <AuthPage />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <CompanyProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <PaywallProvider>
                <Routes>
                  <Route path="/auth" element={<AuthPageWrapper />} />
                  <Route path="/auth/callback" element={<AuthCallbackPage />} />
                  <Route path="/reset-password" element={<ResetPasswordPage />} />
                  <Route path="/*" element={<ProtectedRoutes />} />
                </Routes>
              </PaywallProvider>
            </BrowserRouter>
          </TooltipProvider>
        </CompanyProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
