import { useMemo, useCallback } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import SwipePager from "@/components/SwipePager";
import ContextSwitcher from "@/components/business/ContextSwitcher";
import TrialBanner from "@/components/billing/TrialBanner";
import { useCompany } from "@/contexts/CompanyContext";
import HomePage from "./HomePage";
import SpreadsheetsPage from "./SpreadsheetsPage";
import CoursesPage from "./CoursesPage";
import WorldMap from "@/components/courses/WorldMap";
import ChatPage from "./ChatPage";
import ProfilePage from "./ProfilePage";
import BusinessHomePage from "./business/BusinessHomePage";
import SupportPage from "./SupportPage";
import AdminSupportPage from "./admin/AdminSupportPage";
import AdminSubscriptionsPage from "./admin/AdminSubscriptionsPage";
import AdminDashboardPage from "./admin/AdminDashboardPage";
import AdminUsersPage from "./admin/AdminUsersPage";
import AdminUserDetailPage from "./admin/AdminUserDetailPage";
import AdminLogsPage from "./admin/AdminLogsPage";

// Bottom-nav height in px (h-auto py-2 with 20px icon + label ≈ 64px)
const BOTTOM_NAV_PAD = 80;

const SlotScroller = ({ children }: { children: React.ReactNode }) => (
  <div
    className="h-full overflow-y-auto overscroll-contain px-4"
    style={{ paddingBottom: BOTTOM_NAV_PAD }}
  >
    {children}
  </div>
);

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode } = useCompany();

  const homePath = mode === "business" ? "/empresa" : "/";
  const swipeOrder = useMemo(
    () => ["/planilhas", "/cursos", homePath, "/chat", "/perfil"],
    [homePath]
  );

  const pathname = location.pathname;
  const activeIndex = swipeOrder.indexOf(pathname);
  const isRootTab = activeIndex !== -1;

  const handleIndexChange = useCallback(
    (idx: number) => navigate(swipeOrder[idx]),
    [navigate, swipeOrder]
  );

  return (
    <div className="h-dvh bg-background flex flex-col items-center ambient-glow overflow-hidden">
      <div className="w-full max-w-lg px-4 pt-3 relative z-20 shrink-0">
        <ContextSwitcher />
      </div>
      <div className="w-full max-w-lg shrink-0">
        <TrialBanner />
      </div>
      <main className="w-full max-w-lg flex-1 min-h-0 pt-4 relative z-10">
        {isRootTab ? (
          <SwipePager activeIndex={activeIndex} onIndexChange={handleIndexChange}>
            <SlotScroller><SpreadsheetsPage /></SlotScroller>
            <SlotScroller><WorldMap /></SlotScroller>
            <SlotScroller>{mode === "business" ? <BusinessHomePage /> : <HomePage />}</SlotScroller>
            <SlotScroller><ChatPage /></SlotScroller>
            <SlotScroller><ProfilePage /></SlotScroller>
          </SwipePager>
        ) : (
          <div
            className="h-full overflow-y-auto overscroll-contain px-4"
            style={{ paddingBottom: BOTTOM_NAV_PAD }}
          >
            <Routes>
              <Route path="empresa" element={<BusinessHomePage />} />
              <Route path="cursos/*" element={<CoursesPage />} />
              <Route path="suporte" element={<SupportPage />} />
              <Route path="suporte/:ticketId" element={<SupportPage />} />
              <Route path="admin/suporte" element={<AdminSupportPage />} />
              <Route path="admin/suporte/:ticketId" element={<AdminSupportPage />} />
              <Route path="admin/assinaturas" element={<AdminSubscriptionsPage />} />
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="admin/usuarios" element={<AdminUsersPage />} />
              <Route path="admin/usuarios/:id" element={<AdminUserDetailPage />} />
              <Route path="admin/logs" element={<AdminLogsPage />} />
            </Routes>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
