import { motion } from "motion/react";
import { MicButton } from "./ui/button";

interface Props {
  micActive: boolean;
  onMicToggle: () => void;
  connected: boolean;
}

export function FloatingIsland({ micActive, onMicToggle, connected }: Props) {
  return (
    <motion.div
      initial={{ y: 28, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.4, type: "spring", stiffness: 220, damping: 22 }}
      className="pointer-events-auto fixed bottom-7 left-1/2 z-50 -translate-x-1/2"
    >
      <div className="glass-island flex items-center gap-5 rounded-full px-5 py-3">
        <div className="flex flex-col items-end leading-tight">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-stone)]">
            {connected ? "Maestro online" : "offline"}
          </span>
          <span className="font-display text-sm italic text-[color:var(--color-charcoal)]">
            {micActive ? "Listening — release to send" : "Tap to speak"}
          </span>
        </div>

        <MicButton active={micActive} onClick={onMicToggle} />

        <div className="flex flex-col leading-tight">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-stone)]">
            Rosewood Sand Hill
          </span>
          <span className="font-display text-sm italic text-[color:var(--color-charcoal)]">
            GM ops · live
          </span>
        </div>
      </div>
    </motion.div>
  );
}
