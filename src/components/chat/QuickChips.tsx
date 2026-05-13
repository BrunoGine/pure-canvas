import { motion } from "framer-motion";

interface Props {
  suggestions: string[];
  onPick: (s: string) => void;
  disabled?: boolean;
}

export const QuickChips = ({ suggestions, onPick, disabled }: Props) => (
  <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-thin">
    {suggestions.map((s, i) => (
      <motion.button
        key={s}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.03 }}
        disabled={disabled}
        onClick={() => onPick(s)}
        className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-secondary/60 border border-border/50 hover:border-primary/50 hover:bg-secondary transition-colors disabled:opacity-40"
      >
        {s}
      </motion.button>
    ))}
  </div>
);
