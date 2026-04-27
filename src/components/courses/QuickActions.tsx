import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Award, BarChart3, Dumbbell, type LucideIcon } from "lucide-react";

interface Action {
  label: string;
  icon: LucideIcon;
  color: string;
  to: string;
}

const ACTIONS: Action[] = [
  { label: "Meu Progresso", icon: BarChart3, color: "hsl(280 75% 60%)", to: "/cursos/progresso" },
  { label: "Certificados", icon: Award, color: "hsl(38 92% 50%)", to: "/cursos/progresso?tab=certificados" },
  { label: "Treino", icon: Dumbbell, color: "hsl(150 65% 45%)", to: "/cursos/progresso?tab=treino" },
];

const QuickActions = () => {
  const navigate = useNavigate();
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid grid-cols-3 gap-2"
    >
      {ACTIONS.map(({ label, icon: Icon, color, to }) => (
        <button
          key={label}
          onClick={() => navigate(to)}
          className="group relative flex flex-col items-center justify-center gap-2 py-4 rounded-2xl glass-card hover:shadow-lg hover:-translate-y-0.5 transition-all overflow-hidden"
        >
          <span
            aria-hidden="true"
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: `linear-gradient(135deg, ${color}1a, transparent)` }}
          />
          <div
            className="relative w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${color}, ${color}cc)`, boxShadow: `0 6px 18px -8px ${color}aa` }}
          >
            <Icon size={18} className="text-white" />
          </div>
          <span className="relative text-[11px] font-semibold leading-tight text-center px-1">{label}</span>
        </button>
      ))}
    </motion.div>
  );
};

export default QuickActions;
