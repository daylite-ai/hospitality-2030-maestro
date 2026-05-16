import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import type { System } from "@maestro/protocol";

const SYSTEM_STYLES: Record<System, string> = {
  pms: "border-[color:var(--color-sage-deep)]/30 bg-[color:var(--color-sage)]/10 text-[color:var(--color-sage-deep)]",
  housekeeping: "border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/10 text-[color:var(--color-espresso-soft)]",
  fnb: "border-[color:var(--color-clay)]/30 bg-[color:var(--color-clay)]/8 text-[color:var(--color-clay)]",
  spa: "border-[color:var(--color-stone)]/40 bg-[color:var(--color-stone-light)]/40 text-[color:var(--color-espresso-soft)]",
};

const SYSTEM_DOT: Record<System, string> = {
  pms: "bg-[color:var(--color-sage)]",
  housekeeping: "bg-[color:var(--color-gold)]",
  fnb: "bg-[color:var(--color-clay)]",
  spa: "bg-[color:var(--color-stone)]",
};

export function SystemBadge({ system, label }: { system: System; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-[0.14em]",
        SYSTEM_STYLES[system],
      )}
    >
      <span className={cn("size-1.5 rounded-full", SYSTEM_DOT[system])} />
      {label}
    </span>
  );
}

export function Pill({
  children,
  variant = "neutral",
  className,
}: {
  children: ReactNode;
  variant?: "neutral" | "active" | "success" | "error";
  className?: string;
}) {
  const v: Record<typeof variant, string> = {
    neutral: "border-[color:var(--color-stone-light)] text-[color:var(--color-charcoal)] bg-white/50",
    active:
      "border-[color:var(--color-gold)]/50 text-[color:var(--color-espresso-soft)] bg-[color:var(--color-gold)]/10 thinking",
    success: "border-[color:var(--color-sage)]/40 text-[color:var(--color-sage-deep)] bg-[color:var(--color-sage)]/12",
    error: "border-[color:var(--color-clay)]/50 text-[color:var(--color-clay)] bg-[color:var(--color-clay)]/8",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono text-[10px] tracking-tight",
        v[variant],
        className,
      )}
    >
      {children}
    </span>
  );
}
