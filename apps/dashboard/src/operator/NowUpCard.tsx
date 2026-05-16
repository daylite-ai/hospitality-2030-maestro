import { AnimatePresence, motion } from "motion/react";
import type { OperatorTask } from "./derive";

/**
 * The "Now-Up" card — staff-mobile primary surface.
 *
 * Editorial-luxury aesthetic per May-2026 Rosewood-tier hospitality
 * research: alabaster #F5F1EA background (NOT dark — luxury reads as
 * tactile and high-contrast), Cormorant Garamond room number 56pt+,
 * sans-serif task verb below, forest-tinted constraint pills (the
 * Forbes-grade preference flag).
 *
 * Never shows the guest's full name — staff sees the constraint, not
 * the identity. That's the Rosewood discretion calculus.
 */
export function NowUpCard({ task }: { task: OperatorTask | null }) {
  return (
    <AnimatePresence mode="wait">
      {task ? (
        <motion.article
          key={task.callId}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -32, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 320, damping: 28 }}
          className="flex flex-col gap-5 rounded-3xl border border-[#1A1A1A]/12 bg-[#F5F1EA] px-6 py-7 shadow-[0_1px_0_rgba(255,255,255,0.65)_inset,0_18px_36px_-22px_rgba(26,23,19,0.18)]"
        >
          <header className="flex items-baseline justify-between">
            <p className="font-mono text-[10px] uppercase tracking-[0.40em] text-[#1A1A1A]/45">
              Now up
            </p>
            <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-[#1A1A1A]/35">
              Maestro
            </p>
          </header>

          <h1 className="font-display text-[64px] font-medium leading-none tracking-tight text-[#1A1A1A]">
            {task.headline}
          </h1>
          <p className="font-display text-2xl italic leading-tight text-[#1A1A1A]/65">
            {task.verb}
          </p>

          {task.constraints.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {task.constraints.map((c, i) => (
                <li
                  key={i}
                  className="flex items-center gap-2 border-l-2 border-[#2C3E2C] bg-[#2C3E2C]/6 px-3 py-1.5 font-mono text-[11px] tracking-tight text-[#2C3E2C]"
                >
                  <span aria-hidden className="text-[#2C3E2C]/70">·</span>
                  {c}
                </li>
              ))}
            </ul>
          )}

          {task.note && (
            <p className="border-t border-[#1A1A1A]/10 pt-3 font-display text-base italic leading-snug text-[#1A1A1A]/55">
              {task.note}
            </p>
          )}
        </motion.article>
      ) : (
        <motion.div
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="flex h-72 items-center justify-center rounded-3xl border border-dashed border-[#1A1A1A]/12 px-6"
        >
          <p className="text-center font-display text-xl italic leading-snug text-[#1A1A1A]/45">
            Awaiting next instruction.
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
