import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      {...props}
      className={cn(
        "rounded-2xl border bg-white/70 px-4 py-3 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_8px_24px_-12px_rgba(26,23,19,0.10)]",
        className,
      )}
    />
  );
}

export function CardHairline({ className }: { className?: string }) {
  return <div className={cn("h-px bg-[color:var(--color-stone-light)]/60", className)} />;
}
