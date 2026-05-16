import { useEffect, useMemo, useState } from "react";
import { Toaster, toast } from "sonner";
import type { System, TraceEvent } from "@maestro/protocol";
import { useTraceStream } from "@/hooks/useTraceStream";
import { SystemColumn } from "@/components/SystemColumn";
import { TranscriptCard } from "@/components/TranscriptCard";
import { FloatingIsland } from "@/components/FloatingIsland";
import { KarpSecretButton } from "@/components/KarpSecretButton";
import type { ToolCallCardData } from "@/components/ToolCallCard";

// Spa is wired end-to-end (server + tools + result renderer) but the canned
// demo scenario doesn't touch it. Empty columns read as "incomplete" to
// judges, so we render only the three the demo activates. Spa stays in the
// codebase and re-enables the moment a scenario uses it.
const SYSTEMS: System[] = ["pms", "housekeeping", "fnb"];

/**
 * Distil the raw trace stream into the shape the UI actually renders:
 *   - current turn id (latest started)
 *   - staff transcripts for that turn
 *   - tool calls per system, each with active/done/error status + result preview
 *   - final spoken response + duration once the turn closes
 */
function deriveTurnView(events: TraceEvent[]) {
  let turnId: string | null = null;
  let turnStartedAt: number | null = null;
  const transcripts: { text: string; ts: string; speaker: "staff" | "gm" }[] = [];
  const calls = new Map<string, ToolCallCardData>();
  let lastThought: string | null = null;
  let spokenResponse: string | null = null;
  let turnDuration: number | null = null;
  let active = false; // true while a turn is in flight (after turn_started, before turn_completed/error)

  for (const ev of events) {
    if (ev.type === "turn_started") {
      // New turn — reset everything.
      turnId = ev.turnId;
      turnStartedAt = new Date(ev.startedAt).getTime();
      transcripts.length = 0;
      calls.clear();
      lastThought = null;
      spokenResponse = null;
      turnDuration = null;
      active = true;
      continue;
    }
    if (!turnId || (ev as { turnId?: string }).turnId !== turnId) continue;

    switch (ev.type) {
      case "transcript":
        transcripts.push({ text: ev.text, ts: ev.ts, speaker: ev.speaker });
        // A gm-speaker transcript mid-flight means an interrupt landed: keep
        // existing cards (they were the pre-interrupt work) but clear the
        // thinking buffer + spoken response so the UI re-renders the new plan.
        if (ev.speaker === "gm") {
          lastThought = null;
          spokenResponse = null;
        }
        break;
      case "assistant_thought":
        // Use the latest sentence-ish slice for the italic line under transcript.
        lastThought = (lastThought ?? "") + ev.text;
        if (lastThought.length > 120) lastThought = lastThought.slice(-120);
        break;
      case "tool_call_started": {
        const existing = calls.get(ev.callId);
        calls.set(ev.callId, {
          callId: ev.callId,
          system: ev.system,
          tool: ev.tool,
          args: ev.args ?? existing?.args ?? null,
          status: existing?.status ?? "active",
          durationMs: existing?.durationMs,
          resultPreview: existing?.resultPreview,
        });
        break;
      }
      case "tool_call_completed": {
        calls.set(ev.callId, {
          callId: ev.callId,
          system: ev.system,
          tool: ev.tool,
          args: calls.get(ev.callId)?.args ?? null,
          status: ev.result.ok ? "done" : "error",
          durationMs: ev.durationMs,
          resultPreview: ev.result.text.slice(0, 3_000),
          acked: calls.get(ev.callId)?.acked ?? false,
        });
        break;
      }
      case "staff_ack": {
        const c = calls.get(ev.callId);
        if (c) calls.set(ev.callId, { ...c, acked: true });
        break;
      }
      case "turn_completed":
        spokenResponse = ev.spokenResponse;
        turnDuration = ev.durationMs;
        lastThought = null;
        active = false;
        break;
      case "turn_error":
        spokenResponse = `Internal hiccup — ${ev.message}`;
        turnDuration = turnStartedAt ? Date.now() - turnStartedAt : null;
        lastThought = null;
        active = false;
        break;
    }
  }

  const byColumn: Record<System, ToolCallCardData[]> = { pms: [], housekeeping: [], fnb: [], spa: [] };
  for (const c of calls.values()) byColumn[c.system].push(c);

  return {
    turnId,
    active,
    transcripts,
    thinking: lastThought,
    spokenResponse,
    turnDuration,
    toolCount: calls.size,
    byColumn,
  };
}

const ORCH = "http://localhost:4000";

async function submitText(text: string, source: "voice" | "text" | "demo" = "text") {
  const res = await fetch(`${ORCH}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text, source }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "submit failed");
  }
  return res.json();
}

async function runKarpScenario() {
  const res = await fetch(`${ORCH}/api/scenarios/karp`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start Karp scenario");
  return res.json();
}

async function runRecoveryScenario() {
  const res = await fetch(`${ORCH}/api/scenarios/recovery`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to start recovery scenario");
  return res.json();
}

async function sendInterrupt(turnId: string, text: string) {
  const res = await fetch(`${ORCH}/api/interrupt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ turnId, text }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error ?? "interrupt failed");
  }
}

export default function App() {
  const { events, connected, reset } = useTraceStream();
  const view = useMemo(() => deriveTurnView(events), [events]);

  // ⌘K / `/` → open a quick text input (judges don't see this).
  // ⌘I → open the interrupt input when a turn is mid-stream.
  const [textOpen, setTextOpen] = useState(false);
  const [interruptOpen, setInterruptOpen] = useState(false);
  const [textValue, setTextValue] = useState("");
  const [interruptValue, setInterruptValue] = useState("");
  const [micActive, setMicActive] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "i" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (view.active && view.turnId) setInterruptOpen((o) => !o);
      } else if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || (e.key === "/" && !textOpen && !interruptOpen)) {
        e.preventDefault();
        setTextOpen((o) => !o);
      } else if (e.key === "Escape") {
        setTextOpen(false);
        setInterruptOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [textOpen, interruptOpen, view.active, view.turnId]);

  async function send(text: string, source: "voice" | "text" | "demo" = "text") {
    if (busy || !text.trim()) return;
    setBusy(true);
    try {
      await submitText(text, source);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-paper relative flex min-h-screen flex-col">
      <Toaster position="top-center" theme="light" toastOptions={{ duration: 3500 }} />

      <KarpSecretButton
        onKarp={() => {
          reset();
          void runKarpScenario().catch((err) => toast.error((err as Error).message));
        }}
        onRecovery={() => {
          reset();
          void runRecoveryScenario().catch((err) => toast.error((err as Error).message));
        }}
      />

      <header className="flex items-baseline justify-between border-b border-[color:var(--color-stone-light)] px-10 py-5">
        <div>
          <h1 className="font-display text-[34px] font-medium leading-none text-[color:var(--color-espresso)]">
            Maestro
          </h1>
          <p className="mt-1 font-mono text-[10px] uppercase tracking-[0.32em] text-[color:var(--color-stone)]">
            Operations copilot · Rosewood Sand Hill
          </p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-stone)]">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
          <p className="font-display text-lg italic text-[color:var(--color-charcoal)]">
            {connected ? "Stream live" : "Stream offline"}
          </p>
        </div>
      </header>

      <main className="flex flex-1 flex-col gap-6 px-10 pb-32 pt-6">
        <TranscriptCard
          transcripts={view.transcripts}
          thinking={view.thinking}
          spokenResponse={view.spokenResponse}
          toolCount={view.toolCount}
          durationMs={view.turnDuration}
        />

        <div className="flex flex-row items-stretch gap-5">
          {SYSTEMS.map((s) => (
            <SystemColumn key={s} system={s} calls={view.byColumn[s]} />
          ))}
        </div>
      </main>

      {interruptOpen && view.turnId && (
        <div className="fixed inset-x-0 bottom-28 z-40 mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-[color:var(--color-clay)]/55 bg-white/95 px-4 py-3 shadow-[0_0_0_1px_rgba(184,106,74,0.20),0_20px_40px_-20px_rgba(184,106,74,0.35)] backdrop-blur">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-clay)]">
            GM interjects
          </span>
          <input
            autoFocus
            value={interruptValue}
            onChange={(e) => setInterruptValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const tid = view.turnId!;
                const txt = interruptValue;
                void sendInterrupt(tid, txt)
                  .then(() => {
                    setInterruptValue("");
                    setInterruptOpen(false);
                  })
                  .catch((err) => toast.error((err as Error).message));
              }
            }}
            placeholder="Wait — actually use Villa 3 and add a high chair…"
            className="flex-1 bg-transparent font-display text-lg italic text-[color:var(--color-espresso)] placeholder:text-[color:var(--color-stone)] focus:outline-none"
          />
        </div>
      )}

      {textOpen && (
        <div className="fixed inset-x-0 bottom-28 z-40 mx-auto flex max-w-2xl items-center gap-2 rounded-2xl border border-[color:var(--color-stone-light)] bg-white/95 px-4 py-3 shadow-lg backdrop-blur">
          <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-[color:var(--color-stone)]">
            Fallback
          </span>
          <input
            autoFocus
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                void send(textValue, "text").then(() => {
                  setTextValue("");
                  setTextOpen(false);
                });
              }
            }}
            placeholder="Type a staff message and press Enter…"
            className="flex-1 bg-transparent font-display text-lg text-[color:var(--color-espresso)] placeholder:italic placeholder:text-[color:var(--color-stone)] focus:outline-none"
          />
        </div>
      )}

      <FloatingIsland
        connected={connected}
        micActive={micActive}
        onMicToggle={() => setMicActive((m) => !m)}
      />
    </div>
  );
}
