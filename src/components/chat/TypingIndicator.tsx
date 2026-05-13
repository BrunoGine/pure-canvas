import { Bot } from "lucide-react";
import { motion } from "framer-motion";

export const TypingIndicator = () => (
  <div className="flex gap-3 items-start">
    <div className="w-8 h-8 rounded-xl gradient-primary flex items-center justify-center shrink-0 shadow-glow">
      <Bot size={16} className="text-white" />
    </div>
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 1.4, repeat: Infinity }}
      className="text-sm text-muted-foreground italic pt-1.5"
    >
      Harp está pensando…
    </motion.div>
  </div>
);
