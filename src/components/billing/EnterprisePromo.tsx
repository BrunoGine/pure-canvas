import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Building2, BarChart3, FileText, Wallet, Bot, ArrowRight, Lock } from "lucide-react";

const FEATURES = [
  { icon: BarChart3, title: "Dashboard empresarial", desc: "Receita, despesas e lucro do seu negócio em tempo real." },
  { icon: Wallet, title: "Fluxo de caixa", desc: "Acompanhe entradas e saídas mês a mês com clareza." },
  { icon: FileText, title: "Balanço patrimonial", desc: "PDF profissional pronto para contador e investidores." },
  { icon: Bot, title: "Harp.I.A. empresarial", desc: "Sugestões estratégicas baseadas nos números da empresa." },
];

const EnterprisePromo = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-3xl p-6 border border-[hsl(var(--business-primary)/0.3)]"
        style={{
          background:
            "linear-gradient(135deg, hsl(var(--business-primary)/0.18), hsl(var(--background)) 60%)",
        }}
      >
        <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full opacity-30 blur-3xl bg-[hsl(var(--business-primary))]" />
        <div className="relative">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[hsl(var(--business-primary)/0.2)] text-[hsl(var(--business-primary))] text-[10px] font-semibold uppercase tracking-wide mb-3">
            <Lock size={10} /> Plano Empresa
          </div>
          <h1 className="font-display text-2xl font-bold flex items-center gap-2">
            <Building2 size={22} className="text-[hsl(var(--business-primary))]" />
            Gestão profissional do seu negócio
          </h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-md">
            Tudo que você precisa para enxergar a saúde financeira da empresa — em um só lugar,
            com a inteligência da Harp.I.A.
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {FEATURES.map((f, i) => {
          const Icon = f.icon;
          return (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
              className="glass-card rounded-2xl p-4 flex items-start gap-3"
            >
              <div className="w-9 h-9 rounded-xl bg-[hsl(var(--business-primary)/0.15)] flex items-center justify-center shrink-0">
                <Icon size={18} className="text-[hsl(var(--business-primary))]" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm">{f.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <motion.button
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => navigate("/planos")}
        className="w-full py-4 rounded-2xl bg-gradient-to-r from-[hsl(var(--business-primary))] to-primary-glow text-primary-foreground font-semibold shadow-glow flex items-center justify-center gap-2"
      >
        Desbloquear Minha Empresa <ArrowRight size={18} />
      </motion.button>
      <p className="text-center text-[11px] text-muted-foreground -mt-3">
        A partir de R$ 34,90/mês • cancele quando quiser
      </p>

      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
        onClick={() => navigate(-1)}
        className="w-full py-3 rounded-2xl border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
      >
        Agora não
      </motion.button>
    </div>
  );
};

export default EnterprisePromo;
