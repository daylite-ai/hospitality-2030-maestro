import { AnimatePresence } from "motion/react";
import type { System } from "@maestro/protocol";
import { ToolCallCard, type ToolCallCardData } from "./ToolCallCard";
import { SystemBadge } from "./ui/badge";

const HEADERS: Record<System, { label: string; subtitle: string }> = {
  pms: { label: "PMS", subtitle: "Property Management" },
  housekeeping: { label: "Housekeeping", subtitle: "Cleaning · amenities" },
  fnb: { label: "F & B", subtitle: "Madera · Mayfield" },
  spa: { label: "Spa", subtitle: "Asaya" },
};

export function SystemColumn({ system, calls }: { system: System; calls: ToolCallCardData[] }) {
  const h = HEADERS[system];

  return (
    <section className="flex min-h-0 min-w-[240px] flex-col gap-3">
      <header className="flex shrink-0 items-baseline justify-between border-b border-[color:var(--color-stone-light)] pb-2">
        <div>
          <SystemBadge system={system} label={h.label} />
          <p className="mt-1 font-display text-base italic leading-none text-[color:var(--color-charcoal)]">
            {h.subtitle}
          </p>
        </div>
        <span className="font-mono text-[10px] tracking-wider text-[color:var(--color-stone)]">
          {calls.length.toString().padStart(2, "0")}
        </span>
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto pr-1 [scrollbar-width:thin]">
        <AnimatePresence mode="popLayout">
          {calls.map((c) => (
            <ToolCallCard key={c.callId} data={c} />
          ))}
        </AnimatePresence>
        {calls.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[color:var(--color-stone-light)] px-4 py-6 text-center font-display text-sm italic text-[color:var(--color-stone)]">
            awaiting instruction
          </div>
        )}
      </div>
    </section>
  );
}
