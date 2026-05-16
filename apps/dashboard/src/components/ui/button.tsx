import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

export function MicButton({
  active,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active: boolean }) {
  return (
    <button
      {...props}
      aria-pressed={active}
      className={cn(
        "relative flex size-16 items-center justify-center rounded-full",
        "border border-[color:var(--color-stone-light)] bg-[color:var(--color-alabaster)]",
        "transition-all duration-200 ease-out",
        "hover:scale-[1.03] active:scale-[0.97]",
        active && "bg-[color:var(--color-clay)] border-[color:var(--color-clay)] mic-breathing",
        className,
      )}
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? "white" : "currentColor"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="22" />
      </svg>
    </button>
  );
}

export function GhostButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-[color:var(--color-stone-light)] bg-white/50 px-4 py-1.5 text-xs font-medium tracking-wide text-[color:var(--color-espresso-soft)]",
        "hover:bg-white hover:border-[color:var(--color-stone)] transition-colors",
        className,
      )}
    />
  );
}
