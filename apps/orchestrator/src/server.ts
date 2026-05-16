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

export interface ServerDeps {
  loop: ClaudeLoop;
  port: number;
}

export function startServer(deps: ServerDeps): { close: () => void; broadcast: (e: TraceEvent) => void } {
  const app = new Hono();
  const clients = new Set<WebSocket>();

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
