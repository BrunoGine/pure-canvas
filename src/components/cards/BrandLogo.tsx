interface Props {
  brand: string;
  textColor?: string;
}

const BrandLogo = ({ brand, textColor = "#FFFFFF" }: Props) => {
  switch (brand) {
    case "visa":
      return (
        <span className="font-black italic text-base tracking-tight" style={{ color: textColor }}>
          VISA
        </span>
      );
    case "mastercard":
      return (
        <div className="flex items-center">
          <div className="w-5 h-5 rounded-full bg-red-500 opacity-90" />
          <div className="w-5 h-5 rounded-full bg-yellow-400 opacity-90 -ml-2 mix-blend-screen" />
        </div>
      );
    case "elo":
      return (
        <div className="flex items-center gap-0.5">
          <div className="w-2 h-2 rounded-full bg-yellow-400" />
          <div className="w-2 h-2 rounded-full bg-red-500" />
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="ml-1 font-bold text-xs" style={{ color: textColor }}>
            elo
          </span>
        </div>
      );
    case "amex":
      return (
        <div
          className="px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider"
          style={{ background: "#016FD0", color: "#FFFFFF" }}
        >
          AMEX
        </div>
      );
    case "hipercard":
      return (
        <span className="font-black text-xs italic" style={{ color: "#B22222" }}>
          Hipercard
        </span>
      );
    default:
      return null;
  }
};

export default BrandLogo;
