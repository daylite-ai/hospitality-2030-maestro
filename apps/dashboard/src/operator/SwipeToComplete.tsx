import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useRef } from "react";

/**
 * Full-width "Swipe to complete" slider for the operator surface.
 *
 * Pure motion/react gesture — no extra deps. Crosses the 70% threshold and
 * fires onComplete; otherwise snaps back. This is the only interaction the
 * housekeeper / F&B server has on the page.
 */
export function SwipeToComplete({ onComplete }: { onComplete: () => void }) {
  const track = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const fillOpacity = useTransform(x, [0, 220], [0.2, 0.85]);
  const labelOpacity = useTransform(x, [0, 80], [1, 0]);

  return (
    <div
      ref={track}
      className="relative h-16 w-full overflow-hidden rounded-2xl border border-zinc-700 bg-zinc-900"
    >
      <motion.div
        className="absolute inset-y-0 left-0 bg-emerald-500"
        style={{ width: x, opacity: fillOpacity }}
      />
      <motion.span
        style={{ opacity: labelOpacity }}
        className="absolute inset-0 flex items-center justify-center font-mono text-sm uppercase tracking-[0.28em] text-zinc-400"
      >
        Swipe to complete  ›
      </motion.span>
      <motion.button
        type="button"
        drag="x"
        dragConstraints={track}
        dragElastic={0}
        dragMomentum={false}
        style={{ x }}
        onDragEnd={() => {
          const trackWidth = track.current?.getBoundingClientRect().width ?? 320;
          const threshold = trackWidth * 0.65;
          if (x.get() >= threshold) {
            animate(x, trackWidth - 64, { duration: 0.18, ease: "easeOut" });
            onComplete();
          } else {
            animate(x, 0, { type: "spring", stiffness: 380, damping: 28 });
          }
        }}
        className="absolute inset-y-0 left-0 flex h-16 w-16 cursor-grab items-center justify-center rounded-2xl bg-white text-zinc-900 shadow-[0_2px_8px_rgba(0,0,0,0.5)] active:cursor-grabbing"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </motion.button>
    </div>
  );
}
