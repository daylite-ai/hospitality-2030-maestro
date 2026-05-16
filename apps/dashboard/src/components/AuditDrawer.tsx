import { AnimatePresence, motion } from "motion/react";
import type { System, TraceEvent } from "@maestro/protocol";

/**
 * "Why?" drawer — slides in from the right and shows Claude's reasoning
 * chain for the most recent turn: the thinking buffer, every tool call
 * with timing + args + result, and the final spoken confirmation.
 *
 * Anthropic-judge insurance: when a judge asks "how do you know it
 * didn't hallucinate the room number?" you click the small "Why?" button,
 * the drawer slides in, and they see the literal sequence of reasoning
 * steps + tool results that produced the action.
 *
 * Stays editorial-luxury — alabaster surface, espresso text — to match
 * the GM dashboard's design system; not a dev terminal (that's X-Ray).
 */

const SYSTEM_LABELS: Record<System, string> = {
  pms: "PMS",
  housekeeping: "Housekeeping",
  fnb: "F & B",
  spa: "Spa",
};

interface ToolCallTrace {
  callId: string;
  system: System;
  tool: string;
  args: unknown;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  ok?: boolean;
  resultPreview?: string;
}

interface TurnTrace {
  turnId: string | null;
  source: "voice" | "text" | "demo" | null;
  startedAt: string | null;
  durationMs: number | null;
  transcripts: { text: string; speaker: "staff" | "gm" | "system"; ts: string }[];
  thinking: string;
  toolCalls: ToolCallTrace[];
  spokenResponse: string | null;
}

function deriveMostRecentTurn(events: TraceEvent[]): TurnTrace {
  const out: TurnTrace = {
    turnId: null,
    source: null,
    startedAt: null,
    durationMs: null,
    transcripts: [],
    thinking: "",
    toolCalls: [],
    spokenResponse: null,
  };
  const callMap = new Map<string, ToolCallTrace>();

  for (const ev of events) {
    if (ev.type === "turn_started") {
      out.turnId = ev.turnId;
      out.source = ev.source;
      out.startedAt = ev.startedAt;
      out.transcripts = [];
      out.thinking = "";
      out.toolCalls = [];
      out.spokenResponse = null;
      callMap.clear();
      continue;
    }
    if (!out.turnId || (ev as { turnId?: string }).turnId !== out.turnId) continue;

    switch (ev.type) {
      case "transcript":
        out.transcripts.push({ text: ev.text, speaker: ev.speaker, ts: ev.ts });
        break;
      case "assistant_thought":
        out.thinking += ev.text;
        break;
      case "tool_call_started": {
        const existing = callMap.get(ev.callId);
        callMap.set(ev.callId, {
          callId: ev.callId,
          system: ev.system,
          tool: ev.tool,
          args: ev.args ?? existing?.args ?? null,
          startedAt: existing?.startedAt ?? ev.ts,
          completedAt: existing?.completedAt,
          durationMs: existing?.durationMs,
          ok: existing?.ok,
          resultPreview: existing?.resultPreview,
        });
        break;
      }
      case "tool_call_completed": {
        const existing = callMap.get(ev.callId);
        callMap.set(ev.callId, {
          callId: ev.callId,
          system: ev.system,
          tool: ev.tool,
          args: existing?.args ?? null,
          startedAt: existing?.startedAt,
          completedAt: ev.ts,
          durationMs: ev.durationMs,
          ok: ev.result.ok,
          resultPreview: ev.result.text.slice(0, 600),
        });
        break;
      }
      case "turn_completed":
        out.spokenResponse = ev.spokenResponse;
        out.durationMs = ev.durationMs;
        break;
    }
  }

  out.toolCalls = [...callMap.values()];
  return out;
}

const SYSTEM_DOT: Record<System, string> = {
  pms: "bg-[color:var(--color-sage)]",
  housekeeping: "bg-[color:var(--color-gold)]",
  fnb: "bg-[color:var(--color-clay)]",
  spa: "bg-[color:var(--color-stone)]",
};

function previewArgs(raw: unknown): string {
  if (raw == null) return "";
  if (typeof raw === "string") {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  try {
    return JSON.stringify(raw, null, 2);
  } catch {
    return String(raw);
  }
}

export function AuditDrawer({
  open,
  events,
  onClose,
}: {
  open: boolean;
  events: TraceEvent[];
  onClose: () => void;
}) {
  const turn = deriveMostRecentTurn(events);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="audit-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-40 bg-[color:var(--color-espresso)]/22"
            onClick={onClose}
          />
          <motion.aside
            key="audit-drawer"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 280, damping: 32 }}
            className="fixed right-0 top-0 z-50 flex h-screen w-[440px] max-w-[90vw] flex-col overflow-hidden border-l border-[color:var(--color-stone-light)] bg-[color:var(--color-alabaster)] shadow-[0_0_0_1px_rgba(184,173,159,0.25),0_30px_60px_-30px_rgba(26,23,19,0.30)]"
          >
            <header className="flex items-baseline justify-between border-b border-[color:var(--color-stone-light)] px-6 py-4">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-stone)]">
                  Maestro · audit
                </p>
                <h2 className="mt-0.5 font-display text-2xl italic leading-none text-[color:var(--color-espresso)]">
                  Why did Maestro do that?
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-charcoal)] hover:text-[color:var(--color-espresso)]"
              >
                esc
              </button>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-5">
              {!turn.turnId ? (
                <p className="font-display italic text-[color:var(--color-stone)]">
                  No turn yet. Fire a scenario and reopen.
                </p>
              ) : (
                <div className="flex flex-col gap-5">
                  <Section label="Trigger" mono>
                    <p className="font-display text-lg italic leading-snug text-[color:var(--color-espresso)]">
                      {turn.transcripts[0]?.text ?? "(empty)"}
                    </p>
                    <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.24em] text-[color:var(--color-stone)]">
                      source · {turn.source ?? "—"}
                      {turn.durationMs ? `  ·  total ${(turn.durationMs / 1000).toFixed(1)}s` : ""}
                      {turn.toolCalls.length ? `  ·  ${turn.toolCalls.length} tool calls` : ""}
                    </p>
                  </Section>

                  {turn.transcripts.length > 1 &&
                    turn.transcripts
                      .slice(1)
                      .map((t, i) => (
                        <Section key={i} label={t.speaker === "gm" ? "GM interjects" : "Update"} mono>
                          <p className="font-display italic text-[color:var(--color-clay)]">"{t.text}"</p>
                        </Section>
                      ))}

                  {turn.thinking && (
                    <Section label="Maestro · thinking" mono>
                      <p className="font-display text-[13.5px] leading-relaxed italic text-[color:var(--color-charcoal)]">
                        {turn.thinking.length > 1000
                          ? turn.thinking.slice(0, 1000) + " …"
                          : turn.thinking}
                      </p>
                    </Section>
                  )}

                  <Section label="Tool sequence" mono>
                    <ol className="flex flex-col gap-2">
                      {turn.toolCalls.map((c, i) => (
                        <li
                          key={c.callId}
                          className="rounded-lg border border-[color:var(--color-stone-light)] bg-white/65 px-3 py-2"
                        >
                          <div className="flex items-baseline justify-between gap-3">
                            <span className="flex items-center gap-2 font-mono text-[10.5px] uppercase tracking-[0.22em] text-[color:var(--color-charcoal)]">
                              <span className="text-[color:var(--color-stone)]">{String(i + 1).padStart(2, "0")}</span>
                              <span className={"size-1.5 rounded-full " + SYSTEM_DOT[c.system]} />
                              {SYSTEM_LABELS[c.system]} · {c.tool}
                            </span>
                            {typeof c.durationMs === "number" && (
                              <span
                                className={
                                  "font-mono text-[10px] tracking-tight " +
                                  (c.ok === false
                                    ? "text-[color:var(--color-clay)]"
                                    : "text-[color:var(--color-sage-deep)]")
                                }
                              >
                                {c.ok === false ? "ERR" : "✓"} {c.durationMs}ms
                              </span>
                            )}
                          </div>
                          {c.args ? (
                            <pre className="mt-1.5 max-h-32 overflow-hidden rounded-md bg-[color:var(--color-alabaster-deep)] px-2 py-1.5 font-mono text-[10.5px] leading-snug text-[color:var(--color-charcoal)] whitespace-pre-wrap break-words">
                              {previewArgs(c.args)}
                            </pre>
                          ) : null}
                          {c.resultPreview && (
                            <p className="mt-1.5 line-clamp-3 font-mono text-[10.5px] leading-snug text-[color:var(--color-espresso-soft)]">
                              → {c.resultPreview.replace(/\s+/g, " ")}
                            </p>
                          )}
                        </li>
                      ))}
                      {turn.toolCalls.length === 0 && (
                        <li className="font-display italic text-[color:var(--color-stone)]">
                          No tools were needed for this turn.
                        </li>
                      )}
                    </ol>
                  </Section>

                  {turn.spokenResponse && (
                    <Section label="Maestro → GM" mono>
                      <p className="rounded-lg border border-[color:var(--color-sage)]/30 bg-[color:var(--color-sage)]/10 px-3 py-2 font-display text-base italic leading-snug text-[color:var(--color-espresso)]">
                        "{turn.spokenResponse}"
                      </p>
                    </Section>
                  )}
                </div>
              )}
            </div>

            <footer className="border-t border-[color:var(--color-stone-light)] px-6 py-3">
              <p className="font-mono text-[9.5px] uppercase tracking-[0.32em] text-[color:var(--color-stone)]">
                Opus 4.7 · streaming tool_use · parallel reads · serial writes · explicit tool_result pairing
              </p>
            </footer>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Section({ label, mono, children }: { label: string; mono?: boolean; children: React.ReactNode }) {
  return (
    <section>
      <p
        className={
          (mono ? "font-mono" : "font-display") +
          " mb-2 text-[10px] uppercase tracking-[0.34em] text-[color:var(--color-stone)]"
        }
      >
        {label}
      </p>
      {children}
    </section>
  );
}
