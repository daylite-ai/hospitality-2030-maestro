import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format an ISO timestamp as HH:MM:SS in the local timezone. */
export function formatClock(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("en-US", { hour12: false });
}

/** Pretty-print a JSON-string-or-object, trimmed to maxLines lines. */
export function previewJson(raw: unknown, maxLines = 3): string {
  if (raw == null) return "";
  let s: string;
  try {
    s = typeof raw === "string" ? JSON.stringify(JSON.parse(raw), null, 2) : JSON.stringify(raw, null, 2);
  } catch {
    s = String(raw);
  }
  const lines = s.split("\n");
  if (lines.length <= maxLines) return s;
  return lines.slice(0, maxLines).join("\n") + "\n  …";
}
