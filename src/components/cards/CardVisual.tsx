import { motion } from "framer-motion";
import BankLogo from "./BankLogo";
import BrandLogo from "./BrandLogo";
import { getBank } from "./bankBrandData";

interface Props {
  name: string;
  bank: string;
  brand: string;
  closingDay: number;
  color: string;
  onClick?: () => void;
  selected?: boolean;
}

const CardVisual = ({ name, bank, brand, closingDay, color, onClick, selected }: Props) => {
  const bankInfo = getBank(bank);
  const textColor = bankInfo.textColor;

  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`relative w-full aspect-[1.6/1] rounded-2xl p-4 flex flex-col justify-between text-left overflow-hidden shadow-elevated transition-all ${
        selected ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
      }`}
      style={{
        background: `linear-gradient(135deg, ${color} 0%, ${color}dd 60%, ${color}99 100%)`,
      }}
    >
      {/* shine */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 20% 10%, rgba(255,255,255,0.6) 0%, transparent 40%)",
        }}
      />
      {/* chip */}
      <div className="absolute top-4 right-4 w-9 h-7 rounded-md bg-gradient-to-br from-yellow-200 to-yellow-500 opacity-80 border border-yellow-600/30" />

      <div className="relative z-10 flex items-start justify-between">
        <BankLogo bank={bank} textColor={textColor} />
      </div>

      <div className="relative z-10 space-y-2">
        <p
          className="font-mono text-sm tracking-widest opacity-80"
          style={{ color: textColor }}
        >
          •••• •••• •••• ••••
        </p>
        <div className="flex items-end justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[9px] uppercase opacity-70" style={{ color: textColor }}>
              Titular
            </p>
            <p
              className="text-xs font-semibold uppercase truncate"
              style={{ color: textColor }}
            >
              {name || "Sem nome"}
            </p>
            <p className="text-[10px] opacity-80 mt-0.5" style={{ color: textColor }}>
              Fecha dia {closingDay}
            </p>
          </div>
          <BrandLogo brand={brand} textColor={textColor} />
        </div>
      </div>
    </motion.button>
  );
};

export default CardVisual;
