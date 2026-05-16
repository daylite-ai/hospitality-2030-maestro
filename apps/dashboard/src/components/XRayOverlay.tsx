import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";
import type { TraceEvent } from "@maestro/protocol";

/**
 * X-Ray mode — flip the editorial luxury surface and reveal the raw protocol
 * underneath. Anthropic's applied-AI lead spends their day reading MCP and
 * tool-use JSON; showing them the bytes flatters the engineering work without
 * cluttering the GM-facing pitch.
 *
 * Toggle: Opt+X (Alt+X on non-Mac). Stays out of the keyboard tab order so
 * a curious judge can't tab-into it.
 */
interface Props {
  open: boolean;
  events: TraceEvent[];
  onClose: () => void;
}

function colourFor(t: TraceEvent["type"]): string {
  switch (t) {
    case "turn_started":
    case "turn_completed":
      return "#9ad6b8";
    case "transcript":
      return "#d9c19e";
    case "assistant_thought":
      return "#b7ad9f";
    case "tool_call_started":
      return "#7eb6e0";
    case "tool_call_completed":
      return "#83d088";
    case "staff_ack":
      return "#c9a0ff";
    case "turn_error":
      return "#e07a6d";
    default:
      return "#777";
  }
}

function rowOneLiner(ev: TraceEvent): string {
  switch (ev.type) {
    case "turn_started":
      return `→ ${ev.turnId.slice(0, 8)}  source=${ev.source}`;
    case "transcript":
      return `${ev.speaker.padEnd(6)} "${ev.text.slice(0, 110)}${ev.text.length > 110 ? "…" : ""}"`;
    case "assistant_thought":
      return `${JSON.stringify(ev.text)}`;
    case "tool_call_started":
      return `${ev.system}.${ev.tool}  args=${typeof ev.args === "string" ? ev.args.slice(0, 80) : "(streaming)"}`;
    case "tool_call_completed":
      return `${ev.system}.${ev.tool}  ${ev.result.ok ? "ok" : "ERR"}  ${ev.durationMs}ms  ${ev.result.text.slice(0, 80).replace(/\s+/g, " ")}`;
    case "turn_completed":
      return `← ${ev.turnId.slice(0, 8)}  ${ev.durationMs}ms  "${ev.spokenResponse.slice(0, 110)}"`;
    case "staff_ack":
      return `${ev.ackedBy} acknowledged ${ev.callId.slice(0, 8)}`;
    case "turn_error":
      return `ERR ${ev.message.slice(0, 120)}`;
    case "state_snapshot":
    case "state_changed":
      return ev.type;
  }
}

export function XRayOverlay({ open, events, onClose }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, events.length]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="xray"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="fixed inset-0 z-[60] flex flex-col bg-[#0b0c0e]/96 backdrop-blur"
        >
          <header className="flex items-center justify-between border-b border-white/8 px-6 py-3">
            <div className="flex items-center gap-3">
              <span className="size-1.5 rounded-full bg-[#83d088]" />
              <span className="font-mono text-[10.5px] uppercase tracking-[0.34em] text-white/55">
                Maestro · X-Ray · raw MCP + tool-use stream
              </span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="font-mono text-[10px] uppercase tracking-[0.32em] text-white/55 hover:text-white"
            >
              esc ⏎
            </button>
          </header>

          <div
            ref={scrollerRef}
            className="flex-1 overflow-y-auto px-6 py-4 font-mono text-[11.5px] leading-relaxed"
          >
            {events.length === 0 ? (
              <p className="italic text-white/30">awaiting events…</p>
            ) : (
              events.map((ev, i) => {
                const ts = "ts" in ev ? ev.ts : "startedAt" in ev ? ev.startedAt : "";
                const clock = ts ? new Date(ts).toLocaleTimeString("en-US", { hour12: false }) + "." + String(new Date(ts).getMilliseconds()).padStart(3, "0") : "";
                return (
                  <div key={i} className="flex items-baseline gap-3 py-0.5">
                    <span className="w-24 shrink-0 text-white/30">{clock}</span>
                    <span className="w-32 shrink-0" style={{ color: colourFor(ev.type) }}>
                      {ev.type}
                    </span>
                    <span className="min-w-0 flex-1 break-all text-white/80">{rowOneLiner(ev)}</span>
                  </div>
                );
              })
            )}
          </div>

          <footer className="border-t border-white/8 px-6 py-2">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-white/35">
              4 stdio MCP servers · Anthropic Opus 4.7 · streaming tool_use · sequential state mutations · respawn-based reset
            </p>
          </footer>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
