import { AnimatePresence, motion } from "motion/react";
import type { OperatorTask } from "./derive";

/**
 * The "Now-Up" card. 85% of the screen is the immediate task. Massive
 * serif room number, atomic verb, two PII-stripped Forbes-grade
 * constraints. No clutter.
 */
export function NowUpCard({ task }: { task: OperatorTask | null }) {
  return (
    <AnimatePresence mode="wait">
      {task ? (
        <motion.div
          key={task.callId}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -32, scale: 0.96 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="flex flex-col gap-4 rounded-3xl border border-zinc-800 bg-zinc-900/80 px-6 py-7"
        >
          <p className="font-mono text-[10px] uppercase tracking-[0.4em] text-zinc-500">
            Now up · Maestro
          </p>
          <h1 className="font-display text-6xl leading-none tracking-tight text-white">
            {task.headline}
          </h1>
          <p className="font-display text-2xl italic leading-tight text-zinc-300">
            {task.verb}
          </p>

          {task.constraints.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {task.constraints.map((c, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-400/10 px-2.5 py-1 font-mono text-[11px] tracking-tight text-amber-200"
                >
                  <span aria-hidden className="text-amber-400">
                    ⚠
                  </span>
                  {c}
                </span>
              ))}
            </div>
          )}

          {task.note && (
            <p className="border-t border-zinc-800 pt-3 font-display text-base italic leading-snug text-zinc-400">
              “{task.note}”
            </p>
          )}
        </motion.div>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-zinc-800 px-6"
        >
          <p className="text-center font-display text-xl italic leading-snug text-zinc-500">
            All clear. Maestro will ping you when something needs attention.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
