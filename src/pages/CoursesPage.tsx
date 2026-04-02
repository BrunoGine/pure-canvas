import { motion } from "framer-motion";
import { GraduationCap, Clock, Star, PlayCircle, BookOpen, TrendingUp, PiggyBank, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
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
    color: "bg-primary/10 text-primary",
  },
  {
    title: "Investimentos para Iniciantes",
    description: "Descubra como começar a investir em renda fixa e variável.",
    duration: "6h 15min",
    lessons: 18,
    level: "Iniciante",
    icon: TrendingUp,
    rating: 4.9,
    color: "bg-accent/10 text-accent",
  },
  {
    title: "Controle de Dívidas",
    description: "Estratégias para sair das dívidas e manter a saúde financeira.",
    duration: "3h 00min",
    lessons: 8,
    level: "Intermediário",
    icon: CreditCard,
    rating: 4.7,
    color: "bg-destructive/10 text-destructive",
  },
  {
    title: "Planejamento Financeiro Avançado",
    description: "Monte um plano financeiro completo para curto, médio e longo prazo.",
    duration: "8h 45min",
    lessons: 24,
    level: "Avançado",
    icon: BookOpen,
    rating: 4.6,
    color: "bg-primary/10 text-primary",
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
        <Card className="gradient-primary border-0 shadow-elevated overflow-hidden">
          <CardContent className="p-6">
            <Badge variant="secondary" className="mb-3 bg-primary-foreground/20 text-primary-foreground border-0 text-[10px]">
              EM DESTAQUE
            </Badge>
            <h3 className="text-primary-foreground text-lg font-display font-bold mb-1">
              Jornada Financeira Completa
            </h3>
            <p className="text-primary-foreground/70 text-sm mb-4">
              Do zero ao investidor: trilha completa com 50+ aulas.
            </p>
            <button className="flex items-center gap-2 rounded-full bg-primary-foreground/20 px-4 py-2 text-sm font-medium text-primary-foreground backdrop-blur-sm">
              <PlayCircle size={16} /> Começar agora
            </button>
          </CardContent>
        </Card>
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
            <Card className="shadow-card hover:shadow-elevated transition-shadow cursor-pointer">
              <CardContent className="p-4 flex gap-4">
                <div className={`rounded-xl p-3 ${course.color} shrink-0 self-start`}>
                  <course.icon size={22} />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold leading-tight mb-1">{course.title}</h3>
                  <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{course.description}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Clock size={12} /> {course.duration}</span>
                    <span>{course.lessons} aulas</span>
                    <span className="flex items-center gap-1"><Star size={12} className="text-yellow-500" /> {course.rating}</span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-[10px]">{course.level}</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CoursesPage;
