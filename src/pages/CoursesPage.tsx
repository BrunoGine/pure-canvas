import { motion } from "framer-motion";
import { GraduationCap, Clock, Star, PlayCircle, BookOpen, TrendingUp, PiggyBank, CreditCard } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const courses = [
  {
    title: "Fundamentos de Finanças Pessoais",
    description: "Aprenda a organizar seu orçamento e criar uma reserva de emergência.",
    duration: "4h 30min",
    lessons: 12,
    level: "Iniciante",
    icon: PiggyBank,
    rating: 4.8,
  },
  {
    title: "Investimentos para Iniciantes",
    description: "Descubra como começar a investir em renda fixa e variável.",
    duration: "6h 15min",
    lessons: 18,
    level: "Iniciante",
    icon: TrendingUp,
    rating: 4.9,
  },
  {
    title: "Controle de Dívidas",
    description: "Estratégias para sair das dívidas e manter a saúde financeira.",
    duration: "3h 00min",
    lessons: 8,
    level: "Intermediário",
    icon: CreditCard,
    rating: 4.7,
  },
  {
    title: "Planejamento Financeiro Avançado",
    description: "Monte um plano financeiro completo para curto, médio e longo prazo.",
    duration: "8h 45min",
    lessons: 24,
    level: "Avançado",
    icon: BookOpen,
    rating: 4.6,
  },
];

const CoursesPage = () => {
  return (
    <div className="space-y-6 pb-24">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <GraduationCap size={22} className="text-primary" /> Cursos
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Aprenda educação financeira</p>
      </motion.div>

      {/* Featured */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <div className="relative rounded-2xl overflow-hidden">
          <div className="absolute inset-0 gradient-primary opacity-95" />
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-transparent to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-px bg-white/30" />
          <div className="relative p-6">
            <Badge className="mb-3 bg-white/15 text-white border-white/20 text-[10px] backdrop-blur-sm">
              EM DESTAQUE
            </Badge>
            <h3 className="text-white text-lg font-display font-bold mb-1">
              Jornada Financeira Completa
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Do zero ao investidor: trilha completa com 50+ aulas.
            </p>
            <button className="flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-sm px-4 py-2.5 text-sm font-medium text-white border border-white/20 hover:bg-white/25 transition-all">
              <PlayCircle size={16} /> Começar agora
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-black/10 to-transparent" />
        </div>
      </motion.div>

      {/* Course List */}
      <div className="space-y-3">
        {courses.map((course, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.05 }}
          >
            <div className="glass-card rounded-xl hover:glow-border transition-all duration-300 cursor-pointer p-4 flex gap-4">
              <div className="rounded-xl p-3 bg-primary/10 border border-primary/20 shrink-0 self-start">
                <course.icon size={22} className="text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold leading-tight mb-1">{course.title}</h3>
                <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{course.description}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                  <span>{course.lessons} aulas</span>
                  <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {course.rating}</span>
                </div>
                <Badge variant="outline" className="mt-2 text-[10px] border-border/50">{course.level}</Badge>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
