interface Props {
  bank: string;
  textColor?: string;
}

const BankLogo = ({ bank, textColor = "#FFFFFF" }: Props) => {
  const style = { color: textColor };
  switch (bank) {
    case "nubank":
      return (
        <span className="font-black text-sm tracking-tight" style={style}>
          Nu<span className="opacity-80">.</span>
        </span>
      );
    case "itau":
      return (
        <div className="flex items-center gap-1">
          <div
            className="w-5 h-5 rounded-sm flex items-center justify-center font-black text-[10px]"
            style={{ background: textColor, color: "#EC7000" }}
          >
            i
          </div>
          <span className="font-bold text-xs" style={style}>
            itaú
          </span>
        </div>
      );
    case "bradesco":
      return (
        <span className="font-bold text-xs italic" style={style}>
          Bradesco
        </span>
      );
    case "santander":
      return (
        <div className="flex items-center gap-1">
          <div
            className="w-4 h-4 rounded-full border-2"
            style={{ borderColor: textColor }}
          />
          <span className="font-bold text-xs" style={style}>
            Santander
          </span>
        </div>
      );
    case "inter":
      return (
        <span className="font-black text-xs lowercase tracking-tight" style={style}>
          inter
        </span>
      );
    case "c6":
      return (
        <span className="font-black text-sm tracking-widest" style={style}>
          C6
        </span>
      );
    case "bb":
      return (
        <span className="font-black text-xs tracking-widest" style={style}>
          BB
        </span>
      );
    case "caixa":
      return (
        <span className="font-bold text-xs italic" style={style}>
          CAIXA
        </span>
      );
    default:
      return (
        <span className="font-bold text-xs uppercase tracking-wider" style={style}>
          Banco
        </span>
      );
  }
};

export default BankLogo;
