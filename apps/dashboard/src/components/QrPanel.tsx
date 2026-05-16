import { QRCodeSVG } from "qrcode.react";

/**
 * Post-demo "ask" panel. Shows in the dashboard's idle state and (after
 * the spoken confirmation lands) re-appears as the final on-stage frame.
 *
 * Per May-2026 Cerebral Valley meta: no handouts, no LinkedIn requests.
 * The QR is the entire ask. It should point at a mobile-optimised
 * one-pager (Notion or similar) with: headshot, 60-second Loom demo
 * recap, tech-stack callouts (Anthropic + ElevenLabs to flatter the
 * sponsors), and a Calendly link titled "Book a 15-min tech deep-dive".
 */

const FOUNDER_URL =
  // Update before the demo to your Notion one-pager URL.
  // Falls back to the GitHub repo so judges can scan even if you forget.
  (import.meta.env.VITE_FOUNDER_URL as string | undefined) ??
  "https://github.com/daylite-ai/hospitality-2030-maestro";

export function QrPanel({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact
          ? "flex items-center gap-3"
          : "flex flex-col items-center gap-3 rounded-2xl border border-[color:var(--color-stone-light)] bg-white/70 px-5 py-4"
      }
    >
      <div className="rounded-lg bg-white p-2 shadow-[0_1px_0_rgba(255,255,255,0.85)_inset,0_8px_24px_-12px_rgba(26,23,19,0.10)]">
        <QRCodeSVG
          value={FOUNDER_URL}
          size={compact ? 72 : 132}
          bgColor="#ffffff"
          fgColor="#1A1713"
          level="M"
          marginSize={2}
        />
      </div>
      <div className={compact ? "max-w-[160px]" : "max-w-[220px] text-center"}>
        <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-stone)]">
          Maestro · founder one-pager
        </p>
        <p className={`mt-1 font-display italic text-[color:var(--color-espresso)] ${compact ? "text-sm" : "text-lg"}`}>
          Scan for a 15-minute tech deep-dive.
        </p>
      </div>
    </div>
  );
}
