import { Home, Table2, GraduationCap, MessageCircle, User } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const tabs = [
  { path: "/planilhas", icon: Table2, label: "Planilhas" },
  { path: "/cursos", icon: GraduationCap, label: "Cursos" },
  { path: "/", icon: Home, label: "Início" },
  { path: "/chat", icon: MessageCircle, label: "Harp.I.A" },
  { path: "/perfil", icon: User, label: "Perfil" },
];

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t-0">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2 px-2">
        {tabs.map(({ path, icon: Icon, label }) => {
          const active = location.pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className="relative flex flex-col items-center gap-0.5 px-3 py-1.5 transition-all duration-300 group"
            >
              {active && (
                <motion.div
                  layoutId="nav-indicator"
                  className="absolute -top-0.5 left-1/2 -translate-x-1/2 h-[3px] w-8 rounded-full gradient-primary shadow-glow"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {active && (
                <motion.div
                  layoutId="nav-glow"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: 'radial-gradient(ellipse at center, hsla(233, 70%, 58%, 0.1) 0%, transparent 70%)' }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                size={20}
                className={`transition-all duration-300 ${active ? "text-primary drop-shadow-[0_0_8px_hsla(233,70%,58%,0.5)]" : "text-muted-foreground group-hover:text-foreground"}`}
              />
              <span
                className={`text-[10px] font-medium transition-all duration-300 ${active ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
