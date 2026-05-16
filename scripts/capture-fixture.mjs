#!/usr/bin/env node
/**
 * Capture a complete TraceEvent stream for a given scenario.
 *
 * 1. Open a WebSocket against the running orchestrator's /ws endpoint.
 * 2. POST the scenario endpoint to fire the live Claude run.
 * 3. Collect every TraceEvent until turn_completed (or turn_error).
 * 4. Normalise timestamps to relative-ms offsets and save the fixture.
 *
 * Usage:
 *   node scripts/capture-fixture.mjs karp
 *   node scripts/capture-fixture.mjs proactive
 *
 * Output: fixtures/<scenario>.json
 */
// Node 22+ ships a built-in WebSocket on globalThis — no `ws` package needed.
import { writeFileSync, mkdirSync } from "node:fs";

const SCENARIO = process.argv[2];
if (!SCENARIO || !["karp", "recovery", "proactive"].includes(SCENARIO)) {
  console.error("usage: node scripts/capture-fixture.mjs <karp|recovery|proactive>");
  process.exit(1);
}

const ORCH = "http://localhost:4000";
const WS_URL = "ws://localhost:4000/ws";

const events = [];
let startedAt = null;
let resolved = false;

const ws = new WebSocket(WS_URL);
ws.addEventListener("open", () => {
  console.log("[capture] WS connected — firing scenario...");
  fetch(`${ORCH}/api/scenarios/${SCENARIO}`, { method: "POST" }).then((r) =>
    r.json().then((d) => console.log("[capture] fire ack:", d)),
  );
});
ws.addEventListener("message", (msg) => {
  const ev = JSON.parse(msg.data);
  if (ev.type === "turn_started" && startedAt == null) {
    startedAt = new Date(ev.startedAt).getTime();
  }
  events.push(ev);
  process.stdout.write(`  ${ev.type}\n`);
  if (ev.type === "turn_completed" || ev.type === "turn_error") {
    setTimeout(() => finish(), 500);
  }
});
ws.addEventListener("error", (e) => {
  console.error("[capture] ws error:", e.message ?? e);
  process.exit(1);
});

function finish() {
  if (resolved) return;
  resolved = true;
  mkdirSync("fixtures", { recursive: true });
  const base = startedAt ?? Date.now();
  const normalised = events.map((ev) => {
    const tsField = ev.startedAt ?? ev.ts;
    const t_ms = tsField ? new Date(tsField).getTime() - base : 0;
    return { t_ms, event: ev };
  });
  const path = `fixtures/${SCENARIO}.json`;
  writeFileSync(path, JSON.stringify({ scenario: SCENARIO, events: normalised }, null, 2));
  console.log(`[capture] saved ${normalised.length} events → ${path}`);
  ws.close();
  process.exit(0);
}

setTimeout(() => {
  console.error("[capture] timeout — saving partial");
  finish();
}, 60_000);
