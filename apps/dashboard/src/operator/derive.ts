/**
 * Derive Forbes-grade, PII-stripped task cards from the orchestrator's
 * trace stream.
 *
 *   - Staff never see guest names. The kitchen sees "Suite 14, 2 adults +
 *     2 children, gluten-free, prefers Sand Hill–facing." That respects
 *     Rosewood's discretion ethic without losing the strict preference
 *     constraint that defines five-star service.
 *   - We pull only from tool_call_completed events that target this
 *     department, and we synthesise a concise "Now-Up" representation.
 *   - staff_ack events remove the task from the queue.
 */

import type { TraceEvent } from "@maestro/protocol";

export type Department = "housekeeping" | "fnb";

export interface OperatorTask {
  callId: string;
  department: Department;
  /** Headline — the thing the staffer sees from 8 feet away. */
  headline: string;
  /** Secondary action verb shown below the headline. */
  verb: string;
  /** 0–2 Forbes-grade constraint pills, never including guest identity. */
  constraints: string[];
  /** Optional one-line italic note for context. */
  note?: string;
  /** ISO timestamp the task entered the queue. */
  ts: string;
  /** True once a staff_ack landed for this callId. */
  acked: boolean;
}

function tryParseArgs(raw: unknown): Record<string, unknown> {
  if (raw == null) return {};
  if (typeof raw === "object") return raw as Record<string, unknown>;
  try {
    return JSON.parse(String(raw));
  } catch {
    return {};
  }
}

interface PartyMember {
  role: string;
  age?: number;
}

interface GuestPreferences {
  diet?: string;
  sleep?: string;
  notes?: string;
}

interface GuestRecord {
  party?: PartyMember[];
  preferences?: GuestPreferences;
  currentRoomId?: string;
  primaryName?: string;
}

/** Last seen guest record per turn (we cache the latest pms_get_guest_by_name
 * result so subsequent housekeeping/fnb tasks can inherit constraints
 * without echoing the guest's name). */
interface GuestSnapshot {
  preferences: string[];
  party: { adults: number; children: number };
  primaryNameHash: string;
}

function hashName(name?: string): string {
  if (!name) return "anon";
  // Trivial obfuscation — enough that the staffer can't read "David Karp"
  // off the screen at 8 feet but the GM still knows it's a unique party.
  return "guest-" + name.split(/\s+/).map((s) => s[0]?.toLowerCase()).join("");
}

function extractPreferences(prefs?: GuestPreferences): string[] {
  if (!prefs) return [];
  const out: string[] = [];
  if (prefs.diet) out.push(prefs.diet.split(/[.;]/)[0]?.trim() ?? "");
  if (prefs.sleep) out.push(prefs.sleep.split(/[.;]/)[0]?.trim() ?? "");
  return out.filter((s) => s.length > 0).slice(0, 2);
}

function partyShape(party?: PartyMember[]): { adults: number; children: number } {
  if (!Array.isArray(party)) return { adults: 0, children: 0 };
  let adults = 0;
  let children = 0;
  for (const p of party) {
    if (p.role === "child") children++;
    else adults++;
  }
  return { adults, children };
}

function tryParseGuest(text: string): GuestRecord | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as GuestRecord;
  } catch {
    // fallthrough
  }
  return null;
}

interface RoomRecord {
  number?: string;
  type?: string;
}

function tryParseRoom(text: string): RoomRecord | null {
  try {
    const parsed = JSON.parse(text);
    if (parsed && typeof parsed === "object") return parsed as RoomRecord;
  } catch {
    // fallthrough
  }
  return null;
}

const ROOM_LABELS: Record<string, string> = {
  "r-10": "Suite 10",
  "r-11": "Suite 11",
  "r-12": "Suite 12",
  "r-14": "Suite 14",
  "r-15": "Suite 15",
  "r-16": "Suite 16",
  "r-18": "Suite 18",
  "r-villa-3": "Villa 3",
};

function roomLabel(roomIdOrNumber: string): string {
  return ROOM_LABELS[roomIdOrNumber] ?? `Suite ${roomIdOrNumber}`;
}

const CLEAN_VERBS: Record<string, string> = {
  turndown: "Turndown",
  deep_clean: "Deep clean",
  linens: "Fresh linens",
  amenity_delivery: "Amenity delivery",
  glassware: "Glassware refresh",
};

const RESTAURANT_LABELS: Record<string, string> = {
  madera: "Madera",
  "madera-bar": "Madera Bar",
  mayfield: "Mayfield Bakery",
};

interface PendingState {
  guestSnapshot: GuestSnapshot | null;
  argsByCallId: Map<string, unknown>;
  tasks: Map<string, OperatorTask>;
  ackedCallIds: Set<string>;
}

function freshState(): PendingState {
  return {
    guestSnapshot: null,
    argsByCallId: new Map(),
    tasks: new Map(),
    ackedCallIds: new Set(),
  };
}

function buildHousekeepingTask(
  ev: Extract<TraceEvent, { type: "tool_call_completed" }>,
  snapshot: GuestSnapshot | null,
  rawArgs: unknown,
): OperatorTask | null {
  if (!ev.result.ok) return null;
  const args = tryParseArgs(rawArgs);

  if (ev.tool === "hk_schedule_cleaning") {
    const roomId = String(args.roomId ?? "");
    const type = String(args.type ?? "turndown");
    const priority = String(args.priority ?? "normal");
    const constraints: string[] = [];
    if (priority === "urgent") constraints.push("Urgent");
    if (snapshot) {
      constraints.push(...snapshot.preferences);
    }
    return {
      callId: ev.callId,
      department: "housekeeping",
      headline: roomLabel(roomId),
      verb: CLEAN_VERBS[type] ?? "Service",
      constraints: constraints.slice(0, 2),
      note: typeof args.notes === "string" ? args.notes : undefined,
      ts: ev.ts,
      acked: false,
    };
  }

  if (ev.tool === "hk_create_amenity_ticket") {
    const roomId = String(args.roomId ?? "");
    const items = Array.isArray(args.items) ? (args.items as string[]) : [];
    const note = typeof args.note === "string" ? args.note : undefined;
    return {
      callId: ev.callId,
      department: "housekeeping",
      headline: roomLabel(roomId),
      verb: "Amenity prep",
      constraints: items.slice(0, 2),
      note,
      ts: ev.ts,
      acked: false,
    };
  }

  return null;
}

function buildFnbTask(
  ev: Extract<TraceEvent, { type: "tool_call_completed" }>,
  snapshot: GuestSnapshot | null,
  rawArgs: unknown,
): OperatorTask | null {
  if (!ev.result.ok) return null;
  if (ev.tool !== "fnb_make_reservation") return null;
  const args = tryParseArgs(rawArgs);
  const rest = String(args.restaurantId ?? "madera");
  const time = String(args.time ?? "");
  const partySize = typeof args.partySize === "number" ? args.partySize : 0;
  const note = typeof args.notes === "string" ? args.notes : undefined;
  const constraints: string[] = [`${partySize} pax`, time].filter(Boolean);
  if (snapshot?.preferences[0]) constraints.push(snapshot.preferences[0]);
  return {
    callId: ev.callId,
    department: "fnb",
    headline: RESTAURANT_LABELS[rest] ?? rest,
    verb: `Seat ${partySize}`,
    constraints: constraints.slice(0, 2),
    note,
    ts: ev.ts,
    acked: false,
  };
}

export function deriveOperatorTasks(events: TraceEvent[]): {
  housekeeping: OperatorTask[];
  fnb: OperatorTask[];
} {
  const state = freshState();

  for (const ev of events) {
    if (ev.type === "turn_started") {
      state.guestSnapshot = null;
      // We DO NOT clear tasks across turns — the Now-Up queue is cumulative.
      // Reset events from the operator UI are separate (handled by the
      // dashboard /api/reset path that respawns servers).
    }

    if (ev.type === "tool_call_started") {
      // Cache the args so we can rebuild the staff-facing card at completion.
      // tool_call_started fires multiple times during input_json_delta — the
      // last one before content_block_stop has the full args.
      state.argsByCallId.set(ev.callId, ev.args);
    }

    if (ev.type === "tool_call_completed") {
      const rawArgs = state.argsByCallId.get(ev.callId);

      // Cache guest snapshot from pms_get_guest_by_name results
      if (ev.tool === "pms_get_guest_by_name" && ev.result.ok) {
        const guest = tryParseGuest(ev.result.text);
        if (guest) {
          state.guestSnapshot = {
            preferences: extractPreferences(guest.preferences),
            party: partyShape(guest.party),
            primaryNameHash: hashName(guest.primaryName),
          };
        }
      }

      const hk = buildHousekeepingTask(ev, state.guestSnapshot, rawArgs);
      if (hk) state.tasks.set(hk.callId, hk);
      const fnb = buildFnbTask(ev, state.guestSnapshot, rawArgs);
      if (fnb) state.tasks.set(fnb.callId, fnb);
    }

    if (ev.type === "staff_ack") {
      state.ackedCallIds.add(ev.callId);
      const t = state.tasks.get(ev.callId);
      if (t) state.tasks.set(ev.callId, { ...t, acked: true });
    }
  }

  // Don't worry about read-only PMS args — they don't get cards.
  // (Reassignments aren't actionable by staff; they're already executed.)

  const all = [...state.tasks.values()];
  return {
    housekeeping: all.filter((t) => t.department === "housekeeping" && !t.acked),
    fnb: all.filter((t) => t.department === "fnb" && !t.acked),
  };
}
