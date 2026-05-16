/**
 * MCP server bootstrap helpers used by all 4 Maestro back-of-house servers.
 *
 * Goals:
 *   1. Keep each server file tiny — only domain tools, no boilerplate.
 *   2. All log output goes to stderr so it never corrupts the stdio JSON-RPC
 *      frames the parent orchestrator reads on stdout.
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

export { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
export { z } from "zod";

export interface ServerIdentity {
  name: string;
  version: string;
  /** Human-readable label that surfaces in dashboard traces, e.g. "Property Management" */
  label: string;
}

export async function startStdioServer(
  identity: ServerIdentity,
  register: (server: McpServer) => void,
): Promise<void> {
  const server = new McpServer({ name: identity.name, version: identity.version });
  register(server);

  const transport = new StdioServerTransport();
  await server.connect(transport);

  // stderr only — stdout is reserved for JSON-RPC.
  process.stderr.write(`[${identity.name}] ready — ${identity.label}\n`);

  const shutdown = () => {
    process.stderr.write(`[${identity.name}] shutting down\n`);
    transport.close().finally(() => process.exit(0));
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

/** Wrap a tool handler so any thrown error is converted to a CallToolResult with isError. */
export function safeHandler<TArgs>(
  fn: (args: TArgs) => Promise<{ ok: boolean; text: string }>,
) {
  return async (args: TArgs) => {
    try {
      const r = await fn(args);
      return {
        isError: !r.ok,
        content: [{ type: "text" as const, text: r.text }],
      };
    } catch (err) {
      return {
        isError: true,
        content: [{ type: "text" as const, text: `Internal error: ${(err as Error).message}` }],
      };
    }
  };
}
