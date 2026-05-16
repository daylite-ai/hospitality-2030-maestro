/**
 * Single HTTP + WebSocket server for the orchestrator.
 *
 *   POST /api/submit          — dashboard text input → run a turn → JSON reply
 *   GET  /ws                  — dashboard WebSocket: subscribe to trace events
 *   POST /webhook/elevenlabs  — ElevenLabs Custom LLM webhook (OpenAI-compatible chat completions; SSE response)
 *   GET  /health              — sanity probe
 *
 * Everything on :PORT_ORCHESTRATOR (default 4000) so cloudflared can expose a
 * single tunnel.
 */

import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { WebSocketServer, type WebSocket } from "ws";
import type { TraceEvent } from "@maestro/protocol";
import { ClaudeLoop, InterruptController, newTurnId } from "./claude-loop.ts";
import { handleElevenLabsCustomLlm } from "./elevenlabs.ts";
import type { McpClientPool } from "./mcp-clients.ts";

export const KARP_SCENARIO = [
  "Suite 12 needs a deep clean — the outgoing guests spilled red wine on the rug.",
  "David Karp and his family — wife Rachel, two kids — just landed at SFO, about an hour out.",
  "And Madera's main dining room is fully booked tonight, but the bar still has space.",
].join(" ");

/**
 * Proactive (zero-click) scenario: Maestro wakes up on its own when the PMS
 * clock shows the Karps are 30 minutes out and Suite 12 is still dirty.
 * The Greycroft "autopilot, not copilot" thesis dramatised on stage.
 */
export const PROACTIVE_PROMPT = [
  "[PMS clock advance] The Karp family arrival ETA has been refreshed to 30 minutes from now.",
  "Suite 12 (their original assignment) is still vacant_dirty — the previous guest's red wine spill has not been cleared.",
  "Take initiative immediately. No one is asking you. Prepare the family's arrival end-to-end —",
  "reassign them to the next suitable suite, schedule housekeeping for 12, queue personalised amenities,",
  "and confirm or reserve their dinner — then close with one concise spoken confirmation addressed to the GM",
  "in the voice of a chief-of-staff briefing the boss without being asked.",
].join(" ");

export interface ServerDeps {
  loop: ClaudeLoop;
  pool: McpClientPool;
  port: number;
}

export function startServer(deps: ServerDeps): { close: () => void; broadcast: (e: TraceEvent) => void } {
  const app = new Hono();
  const clients = new Set<WebSocket>();

  /** turnId → live InterruptController, for the /api/interrupt endpoint. */
  const inflight = new Map<string, InterruptController>();

  /**
   * Run a turn that can be barge-interrupted. If POST /api/interrupt fires
   * mid-stream, the current Anthropic stream aborts cleanly and we
   * re-enter runTurn with the prior messages + the GM's new transcript
   * merged into the last user message (so Anthropic's strict alternation
   * is preserved). Loops up to 3 interrupt rounds, then commits.
   */
  async function runInterruptibleTurn(
    transcript: string,
    sourceTag: "voice" | "text" | "demo",
    options: { transcriptSpeaker?: "staff" | "system" } = {},
  ): Promise<{ turnId: string; spokenResponse: string; toolCallCount: number; interrupted: boolean }> {
    const turnId = newTurnId();
    let controller = new InterruptController();
    inflight.set(turnId, controller);
    let priorMessages: import("@anthropic-ai/sdk").default.MessageParam[] | undefined;
    let currentTranscript = transcript;
    let totalToolCallCount = 0;
    let interruptHappened = false;
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        const r = await deps.loop.runTurn({
          turnId,
          transcript: currentTranscript,
          sourceTag,
          onTrace: broadcast,
          interruptController: controller,
          priorMessages,
          transcriptSpeaker: options.transcriptSpeaker,
        });
        totalToolCallCount += r.toolCallCount;
        if (!r.interrupted) {
          return { turnId, spokenResponse: r.spokenResponse, toolCallCount: totalToolCallCount, interrupted: interruptHappened };
        }
        interruptHappened = true;
        process.stderr.write(`[orchestrator] turn ${turnId} interrupted: "${r.interruptText}"\n`);
        priorMessages = r.messages;
        currentTranscript = r.interruptText;
        controller = new InterruptController();
        inflight.set(turnId, controller);
      }
      return { turnId, spokenResponse: "Maestro hit the interrupt limit.", toolCallCount: totalToolCallCount, interrupted: true };
    } finally {
      inflight.delete(turnId);
    }
  }

  // Dashboard runs on :5173 in dev; orchestrator on :4000. Allow CORS so the
  // single-page app can hit /api/* and /webhook/* directly.
  app.use("*", async (c, next) => {
    c.header("Access-Control-Allow-Origin", "*");
    c.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    c.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (c.req.method === "OPTIONS") return c.body(null, 204);
    await next();
  });

  const broadcast = (e: TraceEvent) => {
    const payload = JSON.stringify(e);
    for (const ws of clients) {
      if (ws.readyState === ws.OPEN) {
        try {
          ws.send(payload);
        } catch {
          // ignore
        }
      }
    }
  };

  app.get("/health", (c) =>
    c.json({ ok: true, name: "maestro-orchestrator", connectedDashboards: clients.size }),
  );

  app.post("/api/submit", async (c) => {
    const body = await c.req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    const source = (body?.source as "voice" | "text" | "demo") ?? "text";
    if (!text) return c.json({ error: "text is required" }, 400);

    try {
      const result = await runInterruptibleTurn(text, source);
      return c.json(result);
    } catch (err) {
      const message = (err as Error).message;
      return c.json({ error: message }, 500);
    }
  });

  /**
   * Barge-in interrupt. While a turn is mid-stream, POST here with the GM's
   * new utterance and we abort the Anthropic stream cleanly, then re-enter
   * runTurn with the prior message history + the new transcript appended.
   * The Anthropic stream's AbortController carries the abort across the
   * fetch boundary; in-flight MCP tool calls finish but their results are
   * naturally tied to the next turn's plan.
   */
  app.post("/api/interrupt", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as { turnId?: string; text?: string };
    if (!body.turnId || !body.text || !body.text.trim()) {
      return c.json({ error: "turnId and text required" }, 400);
    }
    const ctl = inflight.get(body.turnId);
    if (!ctl) return c.json({ error: "no active turn with that id" }, 404);
    ctl.abort(body.text.trim());
    return c.json({ ok: true, turnId: body.turnId });
  });

  app.post("/api/reset", async (c) => {
    await deps.pool.resetAll();
    broadcast({
      type: "state_snapshot",
      ts: new Date().toISOString(),
      state: { note: "Demo state reset to baseline." },
    });
    return c.json({ ok: true });
  });

  app.post("/api/scenarios/karp", async (c) => {
    await deps.pool.resetAll();
    // Fire-and-forget so the dashboard can begin rendering events while
    // Claude is still streaming. The turnId is broadcast on turn_started.
    let resolveTurn: ((id: string) => void) | null = null;
    const turnIdPromise = new Promise<string>((r) => {
      resolveTurn = r;
    });
    void (async () => {
      try {
        const result = await runInterruptibleTurn(KARP_SCENARIO, "demo");
        if (resolveTurn) resolveTurn(result.turnId);
      } catch (err) {
        const message = (err as Error).message;
        const turnId = newTurnId();
        broadcast({ type: "turn_error", turnId, message, ts: new Date().toISOString() });
        if (resolveTurn) resolveTurn(turnId);
      }
    })();
    // Don't block on Claude — return immediately. Dashboard learns turnId
    // from the turn_started WS event a few ms later.
    void turnIdPromise;
    return c.json({ ok: true });
  });

  /**
   * Recovery / self-healing demo.
   *
   * Identical front-end transcript as the Karp scenario, but we first
   * arm a one-shot 503 against fnb_make_reservation(restaurant=madera)
   * via the admin_inject_chaos tool. Claude hits Madera, gets the 503,
   * re-plans to Mayfield Bakery, and the spoken confirmation calls out
   * the failover.
   */
  app.post("/api/scenarios/recovery", async (c) => {
    await deps.pool.resetAll();
    try {
      const r = await deps.pool.callTool("admin_inject_chaos", {});
      if (!r.ok) {
        return c.json({ error: `chaos injection failed: ${r.text}` }, 500);
      }
    } catch (err) {
      return c.json({ error: `chaos injection threw: ${(err as Error).message}` }, 500);
    }
    void (async () => {
      try {
        await runInterruptibleTurn(KARP_SCENARIO, "demo");
      } catch (err) {
        const message = (err as Error).message;
        const tid = newTurnId();
        broadcast({ type: "turn_error", turnId: tid, message, ts: new Date().toISOString() });
      }
    })();
    return c.json({ ok: true, scenario: "recovery" });
  });

  /**
   * Staff /operator mobile back-channel.
   *
   * When a housekeeper or F&B server long-presses a task on their phone,
   * the mobile surface POSTs here. We rebroadcast as a staff_ack event so
   * every connected GM dashboard sees the corresponding tool-call card
   * animate from "done" to "✓ acknowledged · floor". The motion is the
   * proof that orchestration closes the loop in real time.
   */
  app.post("/api/operator/ack", async (c) => {
    const body = (await c.req.json().catch(() => ({}))) as {
      callId?: string;
      system?: "pms" | "housekeeping" | "fnb" | "spa";
      ackedBy?: "housekeeping" | "fnb";
    };
    if (!body.callId || !body.system || !body.ackedBy) {
      return c.json({ error: "callId, system, and ackedBy are required" }, 400);
    }
    broadcast({
      type: "staff_ack",
      callId: body.callId,
      system: body.system,
      ackedBy: body.ackedBy,
      ts: new Date().toISOString(),
    });
    return c.json({ ok: true });
  });

  /**
   * Proactive / "autopilot" scenario.
   *
   *   1. Reset to baseline (everyone in their seeded rooms; suite 12 dirty).
   *   2. Bump Karp ETA to 30 minutes from now via admin_advance_guest_eta —
   *      so Claude's pms_get_guest_by_name reflects the urgency.
   *   3. Fire a synthesised system message framed as a PMS clock advance,
   *      not a staff radio. Claude acts unprompted, voices the GM.
   */
  app.post("/api/scenarios/proactive", async (c) => {
    await deps.pool.resetAll();
    try {
      const r = await deps.pool.callTool("admin_advance_guest_eta", {
        guestIdOrName: "Karp",
        minutesFromNow: 30,
      });
      if (!r.ok) return c.json({ error: `eta advance failed: ${r.text}` }, 500);
    } catch (err) {
      return c.json({ error: `eta advance threw: ${(err as Error).message}` }, 500);
    }
    void (async () => {
      try {
        await runInterruptibleTurn(PROACTIVE_PROMPT, "demo", { transcriptSpeaker: "system" });
      } catch (err) {
        const message = (err as Error).message;
        const tid = newTurnId();
        broadcast({ type: "turn_error", turnId: tid, message, ts: new Date().toISOString() });
      }
    })();
    return c.json({ ok: true, scenario: "proactive" });
  });

  app.post("/webhook/elevenlabs", async (c) => handleElevenLabsCustomLlm(c, deps.loop, broadcast));

  const httpServer = serve({ fetch: app.fetch, port: deps.port }, (info) => {
    process.stderr.write(`[orchestrator] HTTP on http://localhost:${info.port}\n`);
  });

  const wss = new WebSocketServer({ server: httpServer as any, path: "/ws" });
  wss.on("connection", (ws) => {
    clients.add(ws);
    process.stderr.write(`[orchestrator] dashboard connected (${clients.size} total)\n`);
    ws.on("close", () => {
      clients.delete(ws);
      process.stderr.write(`[orchestrator] dashboard disconnected (${clients.size} left)\n`);
    });
    ws.on("error", (err) => {
      if ((err as NodeJS.ErrnoException).code !== "EPIPE") {
        process.stderr.write(`[orchestrator] dashboard ws error: ${err.message}\n`);
      }
    });
  });

  return {
    broadcast,
    close: () => {
      wss.close();
      httpServer.close();
    },
  };
}
