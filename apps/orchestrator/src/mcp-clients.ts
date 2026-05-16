/**
 * MCP client pool — spawns and connects to each of the 4 back-of-house
 * MCP servers over stdio, exposes a flat tool list, and routes tool calls
 * to the right server.
 *
 * Process-management rules (per May-2026 hackathon-best-practices research):
 *   - On parent shutdown (SIGINT / SIGTERM / uncaughtException) we send
 *     SIGTERM to every child, then SIGKILL after a short grace.
 *   - We silently swallow EPIPE during shutdown — it's expected when a
 *     child has already closed stdout.
 */

import { spawn, type ChildProcess } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { System } from "@maestro/protocol";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "../../..");

interface ServerSpec {
  system: System;
  label: string;
  scriptPath: string;
}

const SERVERS: ServerSpec[] = [
  { system: "pms", label: "Property Management", scriptPath: "mcp-servers/pms/src/index.ts" },
  { system: "housekeeping", label: "Housekeeping", scriptPath: "mcp-servers/housekeeping/src/index.ts" },
  { system: "fnb", label: "Food & Beverage", scriptPath: "mcp-servers/fnb/src/index.ts" },
  { system: "spa", label: "Asaya Spa", scriptPath: "mcp-servers/spa/src/index.ts" },
];

export interface ToolDescriptor {
  system: System;
  systemLabel: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ConnectedClient {
  spec: ServerSpec;
  client: Client;
  child: ChildProcess;
}

export class McpClientPool {
  private connected: ConnectedClient[] = [];
  /** Map tool-name -> connected client. Tool names are globally-unique by domain prefix (pms_, hk_, fnb_, spa_). */
  private routing = new Map<string, ConnectedClient>();
  private shutdownStarted = false;

  async connect(): Promise<void> {
    for (const spec of SERVERS) {
      const absScript = path.join(REPO_ROOT, spec.scriptPath);
      const tsxBin = path.join(REPO_ROOT, "node_modules/.bin/tsx");
      const transport = new StdioClientTransport({
        command: tsxBin,
        args: [absScript],
        env: { ...process.env, MAESTRO_SYSTEM: spec.system },
        stderr: "pipe",
      });

      const client = new Client(
        { name: "maestro-orchestrator", version: "0.1.0" },
        { capabilities: {} },
      );

      await client.connect(transport);
      const child = (transport as unknown as { _process?: ChildProcess })._process;
      if (child?.stderr) {
        child.stderr.on("data", (chunk: Buffer) => {
          process.stderr.write(`[${spec.system}] ${chunk.toString()}`);
        });
        child.stderr.on("error", (err) => {
          if ((err as NodeJS.ErrnoException).code !== "EPIPE") {
            process.stderr.write(`[${spec.system}] stderr error: ${err}\n`);
          }
        });
      }
      this.connected.push({ spec, client, child: child!, });

      const { tools } = await client.listTools();
      for (const tool of tools) {
        if (this.routing.has(tool.name)) {
          throw new Error(`Tool name collision across MCP servers: ${tool.name}`);
        }
        this.routing.set(tool.name, this.connected[this.connected.length - 1]!);
      }
      process.stderr.write(`[orchestrator] connected ${spec.system} (${tools.length} tools)\n`);
    }
  }

  async listAllTools(): Promise<ToolDescriptor[]> {
    const out: ToolDescriptor[] = [];
    for (const cc of this.connected) {
      const { tools } = await cc.client.listTools();
      for (const t of tools) {
        out.push({
          system: cc.spec.system,
          systemLabel: cc.spec.label,
          name: t.name,
          description: t.description ?? "",
          inputSchema: t.inputSchema as Record<string, unknown>,
        });
      }
    }
    return out;
  }

  systemFor(toolName: string): System | null {
    return this.routing.get(toolName)?.spec.system ?? null;
  }

  async callTool(toolName: string, args: unknown): Promise<{ ok: boolean; text: string }> {
    const cc = this.routing.get(toolName);
    if (!cc) return { ok: false, text: `Unknown tool: ${toolName}` };

    const result = await cc.client.callTool({ name: toolName, arguments: args as Record<string, unknown> });
    const text = Array.isArray(result.content)
      ? result.content
          .filter((c): c is { type: "text"; text: string } => (c as { type: string }).type === "text")
          .map((c) => c.text)
          .join("\n")
      : "";
    return { ok: !result.isError, text };
  }

  async shutdown(): Promise<void> {
    if (this.shutdownStarted) return;
    this.shutdownStarted = true;
    process.stderr.write("[orchestrator] shutting down MCP clients\n");
    for (const cc of this.connected) {
      try {
        await cc.client.close();
      } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== "EPIPE") {
          process.stderr.write(`[orchestrator] close ${cc.spec.system}: ${err}\n`);
        }
      }
      try {
        cc.child?.kill("SIGTERM");
      } catch {
        // already dead
      }
    }
    // Grace then SIGKILL
    await new Promise((r) => setTimeout(r, 250));
    for (const cc of this.connected) {
      try {
        if (cc.child && !cc.child.killed) cc.child.kill("SIGKILL");
      } catch {
        // ignore
      }
    }
  }
}
