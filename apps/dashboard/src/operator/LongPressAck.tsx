import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect, useRef, useState } from "react";

/**
 * Long-press acknowledgement primitive.
 *
 * 300ms hold → fires onComplete. Alabaster ring expands as the press
 * crosses thresholds. Cancels cleanly on early release.
 *
 * Swipe-to-confirm reads iOS-7-era in 2026. Long-press is the editorial-
 * calm move shipped by Alice by Actabl, Optii, and the rest of the luxury
 * hospitality staff-mobile canon.
 */
const HOLD_MS = 320;

export function LongPressAck({ onComplete, disabled = false }: { onComplete: () => void; disabled?: boolean }) {
  const progress = useMotionValue(0); // 0..1
  const ringScale = useTransform(progress, [0, 1], [0.6, 1.18]);
  const ringOpacity = useTransform(progress, [0, 0.05, 1], [0, 0.18, 0]);
  const fillOpacity = useTransform(progress, [0, 1], [0.0, 0.92]);
  const timerRef = useRef<number | null>(null);
  const animationRef = useRef<ReturnType<typeof animate> | null>(null);
  const [holding, setHolding] = useState(false);

  useEffect(() => () => {
    if (timerRef.current) window.clearTimeout(timerRef.current);
    animationRef.current?.stop();
  }, []);

  const begin = () => {
    if (disabled) return;
    setHolding(true);
    animationRef.current?.stop();
    animationRef.current = animate(progress, 1, {
      duration: HOLD_MS / 1000,
      ease: "easeOut",
    });
    timerRef.current = window.setTimeout(() => {
      setHolding(false);
      onComplete();
    }, HOLD_MS);
  };

  const cancel = () => {
    setHolding(false);
    if (timerRef.current) window.clearTimeout(timerRef.current);
    animationRef.current?.stop();
    animationRef.current = animate(progress, 0, { duration: 0.18, ease: "easeOut" });
  };

  return (
    <div className="relative flex h-20 w-full items-center justify-center">
      <motion.div
        aria-hidden
        style={{ scale: ringScale, opacity: ringOpacity }}
        className="absolute inset-0 rounded-2xl border border-[#1A1A1A]/30"
      />
      <button
        type="button"
        disabled={disabled}
        onMouseDown={begin}
        onMouseUp={cancel}
        onMouseLeave={cancel}
        onTouchStart={begin}
        onTouchEnd={cancel}
        onTouchCancel={cancel}
        className="relative h-full w-full overflow-hidden rounded-2xl border border-[#1A1A1A]/30 bg-[#F5F1EA] disabled:opacity-40"
      >
        <motion.div
          aria-hidden
          className="absolute inset-0 bg-[#2C3E2C]"
          style={{ opacity: fillOpacity }}
        />
        <span
          className={
            "relative font-mono text-[11px] uppercase tracking-[0.36em] " +
            (holding ? "text-[#F5F1EA]" : "text-[#1A1A1A]/65")
          }
        >
          {holding ? "Confirming…" : "Hold to acknowledge"}
        </span>
      </button>
    </div>
  );
}
