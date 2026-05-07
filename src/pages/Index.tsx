import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { useLocation, useNavigate, matchPath } from "react-router-dom";
import { motion, useMotionValue, animate, PanInfo } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import HomePage from "./HomePage";
import SpreadsheetsPage from "./SpreadsheetsPage";
import CoursesPage from "./CoursesPage";
import ChatPage from "./ChatPage";
import ProfilePage from "./ProfilePage";

const SWIPE_ORDER = ["/planilhas", "/cursos", "/", "/chat", "/perfil"] as const;

const PAGES: { path: (typeof SWIPE_ORDER)[number]; element: JSX.Element }[] = [
  { path: "/planilhas", element: <SpreadsheetsPage /> },
  { path: "/cursos", element: <CoursesPage /> },
  { path: "/", element: <HomePage /> },
  { path: "/chat", element: <ChatPage /> },
  { path: "/perfil", element: <ProfilePage /> },
];

const routeIndex = (pathname: string) => {
  if (pathname === "/") return SWIPE_ORDER.indexOf("/");
  // cursos/* etc.
  const idx = SWIPE_ORDER.findIndex((r) => r !== "/" && (pathname === r || pathname.startsWith(r + "/")));
  return idx === -1 ? SWIPE_ORDER.indexOf("/") : idx;
};

const Index = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const x = useMotionValue(0);
  const isDragging = useRef(false);

  // Track container width responsively
  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const update = () => setWidth(containerRef.current?.clientWidth ?? 0);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Sync x position when route changes (and not currently dragging)
  useEffect(() => {
    if (width === 0 || isDragging.current) return;
    const idx = routeIndex(location.pathname);
    animate(x, -idx * width, { type: "spring", stiffness: 320, damping: 34 });
  }, [location.pathname, width, x]);

  const onDragStart = () => {
    isDragging.current = true;
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    isDragging.current = false;
    const idx = routeIndex(location.pathname);
    const offset = info.offset.x;
    const velocity = info.velocity.x;
    let nextIdx = idx;
    const threshold = width * 0.25;
    if (offset < -threshold || velocity < -500) nextIdx = idx + 1;
    else if (offset > threshold || velocity > 500) nextIdx = idx - 1;
    nextIdx = Math.max(0, Math.min(SWIPE_ORDER.length - 1, nextIdx));

    // Animate to target then navigate (no jump because route effect will land on same x)
    animate(x, -nextIdx * width, { type: "spring", stiffness: 320, damping: 34 });
    if (nextIdx !== idx) navigate(SWIPE_ORDER[nextIdx]);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center ambient-glow overflow-x-hidden">
      <div ref={containerRef} className="w-full max-w-lg relative z-10 overflow-hidden">
        <motion.div
          className="flex"
          style={{ x, width: width * PAGES.length }}
          drag="x"
          dragConstraints={{ left: -width * (PAGES.length - 1), right: 0 }}
          dragElastic={0.12}
          dragMomentum={false}
          onDragStart={onDragStart}
          onDragEnd={onDragEnd}
        >
          {PAGES.map((p) => (
            <div
              key={p.path}
              className="px-4 pt-6 pb-2 shrink-0"
              style={{ width: width || "100vw" }}
            >
              {p.element}
            </div>
          ))}
        </motion.div>
      </div>
      <BottomNav />
    </div>
  );
};

export default Index;
