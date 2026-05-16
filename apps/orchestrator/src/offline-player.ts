/**
 * Offline / fixture player.
 *
 * Replays a pre-captured TraceEvent stream from `fixtures/<scenario>.json`
 * on a setTimeout schedule based on each event's original t_ms offset.
 * Used when `OFFLINE_MODE=1` is set — typically when the venue Wi-Fi has
 * died mid-demo and we can't reach api.anthropic.com.
 *
 * The fixtures were captured against real Claude Opus 4.7 runs, so the
 * dashboard fan-out, the spoken responses, and the staff_ack loop all
 * look exactly the same as a live run — minus the actual API cost and
 * the network risk.
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { TraceEvent } from "@maestro/protocol";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");

interface FixtureEntry {
  t_ms: number;
  event: TraceEvent;
}
interface Fixture {
  scenario: string;
  events: FixtureEntry[];
}

const cache = new Map<string, Fixture>();

function load(scenario: string): Fixture | null {
  if (cache.has(scenario)) return cache.get(scenario)!;
  const p = path.join(REPO_ROOT, "fixtures", `${scenario}.json`);
  if (!existsSync(p)) {
    process.stderr.write(`[offline] no fixture at ${p}\n`);
    return null;
  }
  const fx = JSON.parse(readFileSync(p, "utf8")) as Fixture;
  cache.set(scenario, fx);
  return fx;
}

function rebrandTurnIds(events: FixtureEntry[]): FixtureEntry[] {
  // Rewrite the original captured turnId so the same fixture replayed
  // twice (re-pressing the Karp hatch) gives a fresh turn the dashboard
  // can render as a brand-new run.
  const newId = `offline-${Math.random().toString(36).slice(2, 10)}`;
  return events.map((e) => {
    const ev = e.event as { turnId?: string };
    if (ev.turnId) return { ...e, event: { ...e.event, turnId: newId } as TraceEvent };
    return e;
  });
}

/**
 * Schedule a fixture replay against the given broadcast sink. Returns a
 * cancel handle that drops all pending timers.
 */
export function replayFixture(
  scenario: string,
  broadcast: (e: TraceEvent) => void,
): { cancel: () => void; durationMs: number } | null {
  const fx = load(scenario);
  if (!fx) return null;
  const events = rebrandTurnIds(fx.events);
  const timers: ReturnType<typeof setTimeout>[] = [];
  // Cap replay duration at original capture + 200ms buffer so a cancelled
  // turn doesn't leak events. Most fixtures are 25-35 sec.
  const durationMs = (events[events.length - 1]?.t_ms ?? 0) + 200;
  for (const entry of events) {
    timers.push(setTimeout(() => broadcast(entry.event), Math.max(0, entry.t_ms)));
  }
  process.stderr.write(
    `[offline] replaying ${scenario}: ${events.length} events over ${(durationMs / 1000).toFixed(1)}s\n`,
  );
  return {
    cancel: () => timers.forEach((t) => clearTimeout(t)),
    durationMs,
  };
}

export const OFFLINE_MODE = process.env.OFFLINE_MODE === "1" || process.env.OFFLINE_MODE === "true";
