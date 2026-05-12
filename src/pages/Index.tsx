import { useRef } from "react";
import { Routes, Route, useLocation, useNavigate } from "react-router-dom";
import BottomNav from "@/components/BottomNav";
import ContextSwitcher from "@/components/business/ContextSwitcher";
import HomePage from "./HomePage";
import SpreadsheetsPage from "./SpreadsheetsPage";
import CoursesPage from "./CoursesPage";
import ChatPage from "./ChatPage";
import ProfilePage from "./ProfilePage";
import BusinessHomePage from "./business/BusinessHomePage";

const SWIPE_ORDER = ["/planilhas", "/cursos", "/", "/chat", "/perfil"];

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const touch = useRef<{ x: number; y: number; t: number } | null>(null);

  const currentIndex = () => {
    const p = location.pathname;
    if (p === "/") return SWIPE_ORDER.indexOf("/");
    const idx = SWIPE_ORDER.findIndex((r) => r !== "/" && p.startsWith(r));
    return idx === -1 ? SWIPE_ORDER.indexOf("/") : idx;
  };

  const onTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touch.current = { x: t.clientX, y: t.clientY, t: Date.now() };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touch.current) return;
    const start = touch.current;
    touch.current = null;
    const t = e.changedTouches[0];
    const dx = t.clientX - start.x;
    const dy = t.clientY - start.y;
    const dt = Date.now() - start.t;
    if (dt > 600) return;
    if (Math.abs(dx) < 60) return;
    if (Math.abs(dy) > Math.abs(dx) * 0.7) return; // mostly vertical → ignore

    // Ignore swipes that started on horizontally-scrollable elements
    let el = e.target as HTMLElement | null;
    while (el && el !== e.currentTarget) {
      if (el.scrollWidth > el.clientWidth) return;
      // Skip swipe inside known interactive horizontal components
      if (el.closest("[data-no-swipe]")) return;
      el = el.parentElement;
    }

    const idx = currentIndex();
    const nextIdx = dx < 0 ? idx + 1 : idx - 1;
    if (nextIdx < 0 || nextIdx >= SWIPE_ORDER.length) return;
    navigate(SWIPE_ORDER[nextIdx]);
  };

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center ambient-glow overflow-x-hidden"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <div className="w-full max-w-lg px-4 pt-3 relative z-20">
        <ContextSwitcher />
      </div>
      <main className="w-full max-w-lg px-4 pt-4 relative z-10">
        <Routes>
          <Route index element={<HomePage />} />
          <Route path="empresa" element={<BusinessHomePage />} />
          <Route path="planilhas" element={<SpreadsheetsPage />} />
          <Route path="cursos/*" element={<CoursesPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="perfil" element={<ProfilePage />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  );
};

export default Index;
