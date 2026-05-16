import { motion } from "motion/react";
import { Card } from "./ui/card";
import { formatClock } from "@/lib/utils";

interface Props {
  transcripts: { text: string; ts: string }[];
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
        <p className="font-display text-2xl italic leading-snug text-[color:var(--color-stone)]">
          Standing by. Tap the microphone or hit{" "}
          <kbd className="rounded border border-[color:var(--color-stone-light)] bg-white px-1.5 py-0.5 font-mono text-[11px] not-italic text-[color:var(--color-espresso-soft)]">
            ⌘ K
          </kbd>{" "}
          to dictate.
        </p>
      )}

      {transcripts.map((t, i) => (
        <motion.p
          key={i}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="font-display text-[22px] leading-snug text-[color:var(--color-espresso)]"
        >
          <span className="mr-2 font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-stone)]">
            {formatClock(t.ts)}
          </span>
          “{t.text}”
        </motion.p>
      ))}

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
          className="rounded-xl border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/8 px-4 py-3"
        >
          <span className="block font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-sage-deep)]">
            Maestro → GM
          </span>
          <p className="mt-1 font-display text-xl italic leading-snug text-[color:var(--color-espresso)]">
            “{spokenResponse}”
          </p>
        </motion.div>
      )}
    </Card>
  );
}
