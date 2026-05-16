import { motion } from "motion/react";
import { Card } from "./ui/card";
import { formatClock } from "@/lib/utils";
import { QrPanel } from "./QrPanel";

interface Props {
  transcripts: { text: string; ts: string; speaker: "staff" | "gm" }[];
  thinking: string | null;
  spokenResponse: string | null;
  toolCount: number;
  durationMs: number | null;
}

export function TranscriptCard({ transcripts, thinking, spokenResponse, toolCount, durationMs }: Props) {
  const hasContent = transcripts.length > 0 || thinking || spokenResponse;

  return (
    <Card className="space-y-3 px-5 py-4">
      <header className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-stone)]">
          Staff radio
        </span>
        {durationMs !== null && (
          <span className="font-mono text-[10px] tracking-tight text-[color:var(--color-charcoal)]">
            {toolCount} tools · {(durationMs / 1000).toFixed(1)}s
          </span>
        )}
      </header>

      {!hasContent && (
        <div className="flex items-start justify-between gap-6 pt-1">
          <p className="font-display text-2xl italic leading-snug text-[color:var(--color-stone)]">
            Standing by. Tap the microphone or hit{" "}
            <kbd className="rounded border border-[color:var(--color-stone-light)] bg-white px-1.5 py-0.5 font-mono text-[11px] not-italic text-[color:var(--color-espresso-soft)]">
              ⌘ K
            </kbd>{" "}
            to dictate.
          </p>
          <QrPanel compact />
        </div>
      )}

      {transcripts.map((t, i) => {
        const isGm = t.speaker === "gm";
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className={
              isGm
                ? "rounded-lg border-l-2 border-[color:var(--color-clay)] bg-[color:var(--color-clay)]/6 px-3 py-1.5 font-display text-[20px] italic leading-snug text-[color:var(--color-clay)]"
                : "font-display text-[22px] leading-snug text-[color:var(--color-espresso)]"
            }
          >
            <span
              className={
                "mr-2 font-mono text-[10px] uppercase tracking-wider " +
                (isGm ? "text-[color:var(--color-clay)]" : "text-[color:var(--color-stone)]")
              }
            >
              {isGm ? "GM interjects" : formatClock(t.ts)}
            </span>
            {isGm ? "" : "“"}{t.text}{isGm ? "" : "”"}
          </motion.p>
        );
      })}

      {thinking && (
        <motion.p
          key={thinking}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="font-display text-sm italic text-[color:var(--color-gold)]"
        >
          {thinking}
        </motion.p>
      )}

      {spokenResponse && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between gap-5 rounded-xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/8 px-4 py-3"
        >
          <div className="flex-1">
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-sage-deep)]">
            Maestro → GM
          </span>
          <p className="mt-1 font-display text-xl italic leading-snug text-[color:var(--color-espresso)]">
            “{spokenResponse}”
          </p>
          </div>
          <QrPanel compact />
        </motion.div>
      )}
    </Card>
  );
}
