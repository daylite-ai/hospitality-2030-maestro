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
import { ClaudeLoop, newTurnId } from "./claude-loop.ts";
import { handleElevenLabsCustomLlm } from "./elevenlabs.ts";
import type { McpClientPool } from "./mcp-clients.ts";

export const KARP_SCENARIO = [
  "Suite 12 needs a deep clean — the outgoing guests spilled red wine on the rug.",
  "David Karp and his family — wife Rachel, two kids — just landed at SFO, about an hour out.",
  "And Madera's main dining room is fully booked tonight, but the bar still has space.",
].join(" ");

export interface ServerDeps {
  loop: ClaudeLoop;
  pool: McpClientPool;
  port: number;
}

export function startServer(deps: ServerDeps): { close: () => void; broadcast: (e: TraceEvent) => void } {
  const app = new Hono();
  const clients = new Set<WebSocket>();

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

    const turnId = newTurnId();
    try {
      const { spokenResponse, toolCallCount } = await deps.loop.runTurn({
        turnId,
        transcript: text,
        sourceTag: source,
        onTrace: broadcast,
      });
      return c.json({ turnId, spokenResponse, toolCallCount });
    } catch (err) {
      const message = (err as Error).message;
      broadcast({ type: "turn_error", turnId, message, ts: new Date().toISOString() });
      return c.json({ turnId, error: message }, 500);
    }
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
    const turnId = newTurnId();
    // Fire-and-forget so the dashboard can begin rendering events while
    // Claude is still streaming.
    void (async () => {
      try {
        await deps.loop.runTurn({ turnId, transcript: KARP_SCENARIO, sourceTag: "demo", onTrace: broadcast });
      } catch (err) {
        broadcast({ type: "turn_error", turnId, message: (err as Error).message, ts: new Date().toISOString() });
      }
    })();
    return c.json({ ok: true, turnId });
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
    const turnId = newTurnId();
    void (async () => {
      try {
        await deps.loop.runTurn({ turnId, transcript: KARP_SCENARIO, sourceTag: "demo", onTrace: broadcast });
      } catch (err) {
        broadcast({ type: "turn_error", turnId, message: (err as Error).message, ts: new Date().toISOString() });
      }
    })();
    return c.json({ ok: true, turnId, scenario: "recovery" });
  });

  /**
   * Staff /operator mobile back-channel.
   *
   * When a housekeeper or F&B server swipes a task complete on their phone,
   * the mobile surface POSTs here. We rebroadcast as a staff_ack event so
   * every connected dashboard (GM laptop) sees the corresponding tool-call
   * card animate from "done" to "ready-acknowledged". The motion design IS
   * the proof that orchestration closes the loop in real time.
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
