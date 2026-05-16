/**
 * ElevenLabs Custom LLM webhook handler.
 *
 * ElevenLabs Conversational AI's "Custom LLM" feature posts an
 * OpenAI-compatible chat-completions payload and expects an SSE stream back
 * (one or more `data: {...}` chunks, terminated by `data: [DONE]`).
 *
 * For Maestro we accept the incoming user message, run Claude+MCP via the
 * orchestrator loop, then stream the spoken-confirmation text back as a single
 * SSE chunk. The reasoning + tool calls are also broadcast to dashboard
 * WebSocket clients in parallel so the GM and audience see the fan-out graph.
 *
 * Latency target: time-to-first-byte under 400ms to avoid TTS timeout.
 */

import type { Context } from "hono";
import { streamSSE } from "hono/streaming";
import type { ClaudeLoop } from "./claude-loop.ts";
import { newTurnId } from "./claude-loop.ts";
import type { TraceEvent } from "@maestro/protocol";

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIChatRequest {
  model?: string;
  messages: OpenAIChatMessage[];
  stream?: boolean;
}

function extractLatestUserText(req: OpenAIChatRequest): string {
  for (let i = req.messages.length - 1; i >= 0; i--) {
    const m = req.messages[i];
    if (m?.role === "user" && m.content) return m.content;
  }
  return "";
}

export async function handleElevenLabsCustomLlm(
  c: Context,
  loop: ClaudeLoop,
  broadcast: (e: TraceEvent) => void,
): Promise<Response> {
  const body = (await c.req.json().catch(() => ({}))) as OpenAIChatRequest;
  const userText = extractLatestUserText(body);

  if (!userText) {
    return c.json({ error: "no user message" }, 400);
  }

  const turnId = newTurnId();
  const createdAt = Math.floor(Date.now() / 1000);
  const responseId = `maestro-${turnId}`;

  return streamSSE(c, async (stream) => {
    // Heartbeat to keep TTFB under 400ms while Claude is reasoning.
    const heartbeat = setInterval(() => {
      stream.writeSSE({ data: "" }).catch(() => undefined);
    }, 250);

    try {
      // Stream a single role chunk immediately so ElevenLabs can begin TTS framing.
      await stream.writeSSE({
        data: JSON.stringify({
          id: responseId,
          object: "chat.completion.chunk",
          created: createdAt,
          model: "maestro-claude-opus-4-7",
          choices: [{ index: 0, delta: { role: "assistant" }, finish_reason: null }],
        }),
      });

      const { spokenResponse } = await loop.runTurn({
        turnId,
        transcript: userText,
        sourceTag: "voice",
        onTrace: broadcast,
      });

      // Final text — one chunk with content, then [DONE]
      await stream.writeSSE({
        data: JSON.stringify({
          id: responseId,
          object: "chat.completion.chunk",
          created: createdAt,
          model: "maestro-claude-opus-4-7",
          choices: [{ index: 0, delta: { content: spokenResponse }, finish_reason: "stop" }],
        }),
      });

      await stream.writeSSE({ data: "[DONE]" });
    } catch (err) {
      const message = (err as Error).message;
      broadcast({ type: "turn_error", turnId, message, ts: new Date().toISOString() });
      await stream.writeSSE({
        data: JSON.stringify({
          id: responseId,
          object: "chat.completion.chunk",
          created: createdAt,
          model: "maestro-claude-opus-4-7",
          choices: [
            {
              index: 0,
              delta: { content: "I hit an internal issue and could not complete that request." },
              finish_reason: "stop",
            },
          ],
        }),
      });
      await stream.writeSSE({ data: "[DONE]" });
    } finally {
      clearInterval(heartbeat);
    }
  });
}
