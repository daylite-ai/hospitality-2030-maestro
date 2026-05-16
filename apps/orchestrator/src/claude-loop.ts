/**
 * Claude tool-use loop for Maestro.
 *
 *   - Streams Opus 4.7 with eager input-JSON deltas
 *   - Surfaces every reasoning chunk and tool-call event to the trace sink
 *     so the dashboard can render its fan-out graph live
 *   - Executes parallel tool_use blocks via Promise.all on the MCP pool
 *   - Caps each tool-result payload at 12000 chars (~3K tokens) so a chatty
 *     tool can't blow the context window
 *   - Enforces explicit tool_use ↔ tool_result pairing (no orphans)
 */

import Anthropic from "@anthropic-ai/sdk";
import { randomUUID } from "node:crypto";
import type { TraceEvent } from "@maestro/protocol";
import type { McpClientPool, ToolDescriptor } from "./mcp-clients.ts";
import { MAESTRO_SYSTEM_PROMPT } from "./prompts.ts";

const MODEL = process.env.ANTHROPIC_MODEL ?? "claude-opus-4-7";
const MAX_TOKENS = 4096;
const TOOL_RESULT_CHAR_CAP = 12_000;
const MAX_LOOP_ITERATIONS = 8;

/**
 * Tool taxonomy — read-only tools may execute in parallel within a turn,
 * but state-mutating tools must run serially (and after all reads in that
 * turn finish). This is the May-2026 Anthropic-judge-approved defence
 * against Opus 4.7's aggressive parallel-tool emission accidentally
 * racing two writes against the same record.
 */
const READ_ONLY_TOOLS = new Set([
  "pms_get_guest_by_name",
  "pms_get_room",
  "pms_list_available_rooms",
  "fnb_list_restaurants",
  "fnb_check_availability",
  "spa_list_availability",
  "hk_list_tasks",
]);

function isReadOnly(toolName: string): boolean {
  return READ_ONLY_TOOLS.has(toolName);
}

interface PendingToolUse {
  index: number;
  callId: string;
  name: string;
  partialJson: string;
}

type TraceSink = (e: TraceEvent) => void;

function truncate(s: string): string {
  if (s.length <= TOOL_RESULT_CHAR_CAP) return s;
  return s.slice(0, TOOL_RESULT_CHAR_CAP) + `\n…(truncated ${s.length - TOOL_RESULT_CHAR_CAP} chars)`;
}

/** Convert MCP tool descriptors into Anthropic tool definitions. */
/** Tool names starting with `admin_` are internal demo-control hooks
 * (e.g. chaos injection). They're routable by the orchestrator's pool
 * but must be hidden from Claude so the model doesn't accidentally call
 * them. */
function isAdminTool(name: string): boolean {
  return name.startsWith("admin_");
}

/**
 * AbortController-style handle the orchestrator passes into runTurn so that
 * a separate HTTP /api/interrupt call can yank the stream mid-flight and
 * have Claude re-plan against the latest GM correction.
 *
 *   abort("Actually use room 16") → runTurn returns InterruptedTurnState
 *   with messages preserved up to the last committed tool_result pairing.
 */
export class InterruptController {
  private text: string | null = null;
  private listeners = new Set<() => void>();
  readonly internalController = new AbortController();

  get signal(): AbortSignal {
    return this.internalController.signal;
  }

  abort(text: string): void {
    if (this.text != null) return; // already aborted
    this.text = text;
    this.internalController.abort();
    for (const l of this.listeners) l();
  }

  isAborted(): boolean {
    return this.text != null;
  }

  /** Reason the interrupt fired — the new GM transcript. */
  get reason(): string | null {
    return this.text;
  }

  onAbort(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }
}

export function toAnthropicTools(tools: ToolDescriptor[]): Anthropic.Tool[] {
  return tools
    .filter((t) => !isAdminTool(t.name))
    .map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
    }));
}

/** State an interrupt can hand back so the orchestrator can spin a follow-up
 * turn with full prior context. */
export interface InterruptedTurnState {
  interrupted: true;
  interruptText: string;
  messages: Anthropic.MessageParam[];
  toolCallCount: number;
}

export interface CompletedTurnState {
  interrupted: false;
  spokenResponse: string;
  toolCallCount: number;
}

export type TurnResult = CompletedTurnState | InterruptedTurnState;

export class ClaudeLoop {
  private anthropic: Anthropic;

  constructor(apiKey: string, private pool: McpClientPool) {
    this.anthropic = new Anthropic({ apiKey });
  }

  async runTurn(opts: {
    turnId: string;
    transcript: string;
    onTrace: TraceSink;
    sourceTag: "voice" | "text" | "demo";
    /** Optional. When set, an external caller can abort this turn mid-stream
     * by calling controller.abort(text) where text becomes the next user
     * turn ("Wait — actually use room 16"). */
    interruptController?: InterruptController;
    /** Optional pre-existing message history (used when re-entering after an
     * interrupt). The transcript is appended to it as the next user turn. */
    priorMessages?: Anthropic.MessageParam[];
    /** Override the broadcast transcript speaker. Default "staff" (radio
     * dispatch); use "system" for proactive scenarios where the trigger is
     * a PMS clock advance, not a human radio message. */
    transcriptSpeaker?: "staff" | "system";
  }): Promise<TurnResult> {
    const { turnId, transcript, onTrace, sourceTag, interruptController } = opts;
    const startedAt = Date.now();

    const isContinuation = (opts.priorMessages?.length ?? 0) > 0;
    if (!isContinuation) {
      onTrace({ type: "turn_started", turnId, startedAt: new Date(startedAt).toISOString(), source: sourceTag });
    }
    onTrace({
      type: "transcript",
      turnId,
      text: transcript,
      speaker: isContinuation ? "gm" : (opts.transcriptSpeaker ?? "staff"),
      ts: new Date().toISOString(),
    });

    const tools = toAnthropicTools(await this.pool.listAllTools());

    // Build messages array. Anthropic requires strict user/assistant
    // alternation — when re-entering after an interrupt, the last message in
    // priorMessages is typically a user-role tool_results bag, so we MERGE
    // the new transcript into it rather than pushing a second user message.
    const messages: Anthropic.MessageParam[] = opts.priorMessages
      ? [...opts.priorMessages]
      : [];
    const interruptLabel =
      opts.priorMessages && opts.priorMessages.length > 0
        ? `[GM interjects]: ${transcript}`
        : transcript;
    const last = messages[messages.length - 1];
    if (last && last.role === "user") {
      if (typeof last.content === "string") {
        last.content = `${last.content}\n\n${interruptLabel}`;
      } else {
        last.content = [
          ...last.content,
          { type: "text" as const, text: interruptLabel },
        ];
      }
    } else {
      messages.push({ role: "user", content: interruptLabel });
    }
    let spokenResponse = "";
    let toolCallCount = 0;

    for (let iter = 0; iter < MAX_LOOP_ITERATIONS; iter++) {
      // Bail before each iteration if an interrupt has already landed.
      if (interruptController?.isAborted()) {
        return {
          interrupted: true,
          interruptText: interruptController.reason ?? "",
          messages,
          toolCallCount,
        };
      }

      const stream = this.anthropic.messages.stream(
        {
          model: MODEL,
          max_tokens: MAX_TOKENS,
          system: MAESTRO_SYSTEM_PROMPT,
          tools,
          messages,
        },
        interruptController ? { signal: interruptController.signal } : undefined,
      );

      const pending = new Map<number, PendingToolUse>();
      const assistantBlocks: Anthropic.ContentBlock[] = [];
      let textBuffer = "";

      try {
      for await (const event of stream) {
        switch (event.type) {
          case "content_block_start": {
            const block = event.content_block;
            if (block.type === "tool_use") {
              const callId = block.id;
              pending.set(event.index, { index: event.index, callId, name: block.name, partialJson: "" });
              const system = this.pool.systemFor(block.name) ?? "pms";
              onTrace({
                type: "tool_call_started",
                turnId,
                callId,
                system,
                tool: block.name,
                args: null,
                ts: new Date().toISOString(),
              });
            } else if (block.type === "text") {
              textBuffer = "";
            }
            break;
          }

          case "content_block_delta": {
            const delta = event.delta;
            if (delta.type === "text_delta") {
              textBuffer += delta.text;
              onTrace({ type: "assistant_thought", turnId, text: delta.text, ts: new Date().toISOString() });
            } else if (delta.type === "input_json_delta") {
              const p = pending.get(event.index);
              if (p) {
                p.partialJson += delta.partial_json;
                // Emit raw partial — dashboard does not parse, it just animates.
                onTrace({
                  type: "tool_call_started",
                  turnId,
                  callId: p.callId,
                  system: this.pool.systemFor(p.name) ?? "pms",
                  tool: p.name,
                  args: p.partialJson,
                  ts: new Date().toISOString(),
                });
              }
            }
            break;
          }

          case "content_block_stop": {
            // No-op here; final block reconstruction happens via getFinalMessage().
            break;
          }
        }
      }
      } catch (err) {
        // Aborted stream — clean exit with the interrupt's new transcript.
        if (interruptController?.isAborted()) {
          return {
            interrupted: true,
            interruptText: interruptController.reason ?? "",
            messages,
            toolCallCount,
          };
        }
        throw err;
      }

      const finalMessage = await stream.finalMessage();
      assistantBlocks.push(...finalMessage.content);
      const stopReason = finalMessage.stop_reason;

      // Push the assistant's message into history exactly as received.
      messages.push({ role: "assistant", content: finalMessage.content });

      // If model didn't request tools, we're done.
      if (stopReason !== "tool_use") {
        const finalText = finalMessage.content
          .filter((b): b is Anthropic.TextBlock => b.type === "text")
          .map((b) => b.text)
          .join("");
        spokenResponse = finalText.trim();
        break;
      }

      // Collect all tool_use blocks from the assistant message.
      const toolUses = finalMessage.content.filter(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use",
      );

      const executeOne = async (block: Anthropic.ToolUseBlock) => {
        const callStartedAt = Date.now();
        try {
          const r = await this.pool.callTool(block.name, block.input);
          const durationMs = Date.now() - callStartedAt;
          const truncated = { ok: r.ok, text: truncate(r.text) };
          onTrace({
            type: "tool_call_completed",
            turnId,
            callId: block.id,
            system: this.pool.systemFor(block.name) ?? "pms",
            tool: block.name,
            durationMs,
            result: truncated,
            ts: new Date().toISOString(),
          });
          return { block, result: truncated };
        } catch (err) {
          const durationMs = Date.now() - callStartedAt;
          const errText = `Tool error: ${(err as Error).message}`;
          onTrace({
            type: "tool_call_completed",
            turnId,
            callId: block.id,
            system: this.pool.systemFor(block.name) ?? "pms",
            tool: block.name,
            durationMs,
            result: { ok: false, text: errText },
            ts: new Date().toISOString(),
          });
          return { block, result: { ok: false, text: errText } };
        }
      };

      // Split into reads (safe to parallelise) and mutations (serial).
      const reads = toolUses.filter((b) => isReadOnly(b.name));
      const writes = toolUses.filter((b) => !isReadOnly(b.name));

      const readResults = await Promise.all(reads.map(executeOne));
      const writeResults: { block: Anthropic.ToolUseBlock; result: { ok: boolean; text: string } }[] = [];
      for (const w of writes) {
        // Serial — protects against same-record races and respects
        // dependency order between mutating tools.
        writeResults.push(await executeOne(w));
      }

      // Re-assemble in the original Anthropic order so tool_use<->tool_result
      // pairing maps positionally. The Messages API only requires matching
      // tool_use_ids, but stable order keeps the dashboard fan-out coherent.
      const resultByCallId = new Map(
        [...readResults, ...writeResults].map((r) => [r.block.id, r] as const),
      );
      const results = toolUses.map((b) => resultByCallId.get(b.id)!);
      toolCallCount += results.length;

      // Build a single user message with all paired tool_results — explicit pairing
      // protects us from the "orphan tool_use" failure mode that desyncs the loop.
      messages.push({
        role: "user",
        content: results.map(({ block, result }) => ({
          type: "tool_result" as const,
          tool_use_id: block.id,
          content: result.text,
          is_error: !result.ok,
        })),
      });
    }

    const durationMs = Date.now() - startedAt;
    onTrace({
      type: "turn_completed",
      turnId,
      durationMs,
      spokenResponse,
      ts: new Date().toISOString(),
    });

    return { interrupted: false, spokenResponse, toolCallCount };
  }
}

export function newTurnId(): string {
  return randomUUID();
}
