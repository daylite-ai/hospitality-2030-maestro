/**
 * Maestro orchestrator entry point.
 *
 *   1. Spawn + connect to all 4 MCP servers via stdio
 *   2. Start the unified Hono+WS server on PORT_ORCHESTRATOR
 *   3. Bridge SIGINT/SIGTERM/uncaughtException → graceful MCP+HTTP shutdown
 */

import { McpClientPool } from "./mcp-clients.ts";
import { ClaudeLoop } from "./claude-loop.ts";
import { startServer } from "./server.ts";

const PORT = Number(process.env.PORT_ORCHESTRATOR ?? 4000);
const API_KEY = process.env.ANTHROPIC_API_KEY;

if (!API_KEY) {
  process.stderr.write("[orchestrator] ANTHROPIC_API_KEY is not set — Claude calls will fail\n");
}

const pool = new McpClientPool();
await pool.connect();

const loop = new ClaudeLoop(API_KEY ?? "missing", pool);
const server = startServer({ loop, port: PORT });

let shuttingDown = false;
async function gracefulShutdown(reason: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  process.stderr.write(`[orchestrator] shutdown initiated: ${reason}\n`);
  try {
    server.close();
  } catch {
    // ignore
  }
  await pool.shutdown();
  process.exit(0);
}

process.on("SIGINT", () => void gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => void gracefulShutdown("SIGTERM"));
process.on("uncaughtException", (err) => {
  if ((err as NodeJS.ErrnoException).code === "EPIPE") return;
  process.stderr.write(`[orchestrator] uncaughtException: ${err.message}\n${err.stack}\n`);
  void gracefulShutdown("uncaughtException");
});
process.on("unhandledRejection", (reason) => {
  process.stderr.write(`[orchestrator] unhandledRejection: ${String(reason)}\n`);
});

process.stderr.write(`[orchestrator] ready on :${PORT}\n`);
