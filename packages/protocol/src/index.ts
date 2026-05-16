/**
 * Wire protocol between orchestrator and dashboard (WebSocket).
 *
 * Every event includes a turn ID so the dashboard can group activity for a
 * single staff voice message into one "card" / fan-out graph node.
 */

export type System = "pms" | "housekeeping" | "fnb" | "spa";

export type TraceEvent =
  | TurnStartedEvent
  | TranscriptEvent
  | AssistantThoughtEvent
  | ToolCallStartedEvent
  | ToolCallCompletedEvent
  | TurnCompletedEvent
  | TurnErrorEvent
  | StateSnapshotEvent
  | StateChangedEvent
  | StaffAckEvent;

export interface TurnStartedEvent {
  type: "turn_started";
  turnId: string;
  startedAt: string;
  source: "voice" | "text" | "demo";
}

export interface TranscriptEvent {
  type: "transcript";
  turnId: string;
  text: string;
  speaker: "staff" | "gm" | "system";
  ts: string;
}

export interface AssistantThoughtEvent {
  type: "assistant_thought";
  turnId: string;
  text: string;
  ts: string;
}

export interface ToolCallStartedEvent {
  type: "tool_call_started";
  turnId: string;
  callId: string;
  system: System;
  tool: string;
  args: unknown;
  ts: string;
}

export interface ToolCallCompletedEvent {
  type: "tool_call_completed";
  turnId: string;
  callId: string;
  system: System;
  tool: string;
  durationMs: number;
  result: { ok: boolean; text: string };
  ts: string;
}

export interface TurnCompletedEvent {
  type: "turn_completed";
  turnId: string;
  durationMs: number;
  spokenResponse: string;
  ts: string;
}

export interface TurnErrorEvent {
  type: "turn_error";
  turnId: string;
  message: string;
  ts: string;
}

export interface StateSnapshotEvent {
  type: "state_snapshot";
  ts: string;
  state: unknown;
}

export interface StateChangedEvent {
  type: "state_changed";
  ts: string;
  system: System;
  action: string;
  detail: Record<string, unknown>;
}

/** Staff acknowledged a task on the /operator mobile surface. Broadcast to
 * every connected dashboard so the GM's view of the corresponding tool-call
 * card animates from "done" to "ready-acknowledged". */
export interface StaffAckEvent {
  type: "staff_ack";
  callId: string;
  system: System;
  ackedBy: "housekeeping" | "fnb";
  ts: string;
}

/** Client → server: a fresh staff voice/text message to process. */
export interface ClientRequest {
  type: "submit";
  source: "voice" | "text" | "demo";
  text: string;
}
