/**
 * Per-tool "magic moment" result visualisations.
 *
 * Generic "tool called: pms_reassign_guest_room" cards lose the room.
 * VCs and hotel execs want to see HOTEL STATE CHANGED. Each renderer
 * below builds a small, editorial-feeling micro-state card for one
 * specific tool. Unknown tools fall through to a truncated JSON preview.
 */

import { motion } from "motion/react";
import type { ToolCallCardData } from "./ToolCallCard";

function tryParse<T = unknown>(raw: unknown): T | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as T;
  try {
    return JSON.parse(String(raw)) as T;
  } catch {
    return null;
  }
}

function tryParseResultJson(text: string): Record<string, unknown> | null {
  // Tool results from the orchestrator are pretty-printed JSON strings or
  // human-readable lines. We try JSON.parse first; fall back to null.
  const trimmed = text.trim();
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

const Pill = ({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "gold" | "sage" | "clay" }) => {
  const tones = {
    default: "border-[color:var(--color-stone-light)] bg-white text-[color:var(--color-espresso-soft)]",
    gold: "border-[color:var(--color-gold)]/50 bg-[color:var(--color-gold)]/12 text-[color:var(--color-espresso)]",
    sage: "border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/12 text-[color:var(--color-sage-deep)]",
    clay: "border-[color:var(--color-clay)]/40 bg-[color:var(--color-clay)]/8 text-[color:var(--color-clay)]",
  } as const;
  return <span className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 font-mono text-[10px] tracking-tight ${tones[tone]}`}>{children}</span>;
};

// ──────────── PMS ────────────

function PmsReassignRoom({ args, _result }: { args: Record<string, string>; _result: string }) {
  // The result text is a sentence like "Reassigned David Karp from room 12 to room 14."
  // Args have guestId/newRoomId/reason. We extract the visual essentials.
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 24 }}
      className="flex items-center justify-between gap-2 rounded-lg border border-[color:var(--color-stone-light)] bg-white/60 px-3 py-2"
    >
      <RoomChip label="from" mood="error" />
      <span className="font-mono text-xs text-[color:var(--color-charcoal)]">→</span>
      <RoomChip label="to" mood="success" />
      {args.reason && (
        <p className="ml-2 line-clamp-1 max-w-[120px] flex-1 truncate text-[10px] italic text-[color:var(--color-charcoal)]">
          {args.reason}
        </p>
      )}
    </motion.div>
  );
}

function RoomChip({ label, mood }: { label: string; mood: "success" | "error" }) {
  const bg =
    mood === "success"
      ? "border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/15"
      : "border-[color:var(--color-clay)]/40 bg-[color:var(--color-clay)]/10";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-1 ${bg}`}>
      <span className="size-2 rounded-sm bg-[color:var(--color-stone)]/40" />
      <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-charcoal)]">
        {label}
      </span>
    </span>
  );
}

function PmsGuestLookup({ result }: { result: string }) {
  const guest = tryParseResultJson(result);
  if (!guest) return null;
  const name = String(guest.primaryName ?? "—");
  const tier = String(guest.loyaltyTier ?? "—");
  const party = Array.isArray(guest.party) ? (guest.party as Array<{ name: string; role: string; age?: number }>) : [];
  const stays = (guest.history as { stays?: number } | undefined)?.stays ?? 0;

  return (
    <div className="space-y-1.5 rounded-lg border border-[color:var(--color-stone-light)] bg-white/60 px-3 py-2">
      <div className="flex items-center justify-between">
        <p className="font-display text-base leading-tight text-[color:var(--color-espresso)]">{name}</p>
        <Pill tone="gold">{tier}</Pill>
      </div>
      <div className="flex flex-wrap items-center gap-1">
        {party.map((p, i) => (
          <Pill key={i} tone="default">
            {p.name}
            {p.age != null ? ` · ${p.age}` : ""}
          </Pill>
        ))}
      </div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-stone)]">
        {stays} prior stays
      </p>
    </div>
  );
}

interface RoomState {
  number?: string;
  type?: string;
  status?: string;
  notes?: string;
  assignedGuestId?: string | null;
}

function statusTone(status?: string): "sage" | "clay" | "gold" | "default" {
  switch (status) {
    case "vacant_clean":
      return "sage";
    case "vacant_dirty":
    case "deep_clean_required":
      return "clay";
    case "occupied":
      return "gold";
    default:
      return "default";
  }
}

function PmsGetRoom({ result }: { result: string }) {
  const room = tryParseResultJson(result) as RoomState | null;
  if (!room || !room.number) return null;
  const statusLabel = (room.status ?? "—").replace(/_/g, " ");
  return (
    <div className="space-y-1.5 rounded-lg border border-[color:var(--color-stone-light)] bg-white/60 px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        <p className="font-display text-base leading-tight text-[color:var(--color-espresso)]">
          Suite {room.number}
          {room.type ? <span className="ml-1.5 text-[color:var(--color-stone)] text-[12px] italic">· {room.type}</span> : null}
        </p>
        <Pill tone={statusTone(room.status)}>{statusLabel}</Pill>
      </div>
      {room.notes ? (
        <p className="font-display text-xs italic leading-snug text-[color:var(--color-charcoal)]">
          “{room.notes}”
        </p>
      ) : null}
    </div>
  );
}

function PmsListAvailableRooms({ result }: { result: string }) {
  const rooms = tryParseResultJson(result);
  if (!Array.isArray(rooms)) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {(rooms as Array<{ number: string; type: string }>).slice(0, 8).map((r, i) => (
        <Pill key={i} tone="sage">
          {r.number} · {r.type}
        </Pill>
      ))}
    </div>
  );
}

// ──────────── Housekeeping ────────────

function HkScheduleCleaning({ args }: { args: Record<string, string> }) {
  const priority = (args.priority ?? "normal").toLowerCase();
  const tone = priority === "urgent" ? "clay" : priority === "low" ? "default" : "gold";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-stone-light)] bg-white/60 px-3 py-2">
      <Pill tone={tone}>{priority}</Pill>
      <span className="font-display text-sm italic text-[color:var(--color-espresso)]">
        {(args.type ?? "task").replace("_", " ")}
      </span>
      {args.notes && (
        <span className="ml-auto line-clamp-1 max-w-[180px] text-[10px] italic text-[color:var(--color-charcoal)]">
          “{args.notes}”
        </span>
      )}
    </div>
  );
}

function HkAmenity({ args }: { args: { items?: string[]; note?: string } }) {
  const items = args.items ?? [];
  return (
    <div className="rounded-lg border border-[color:var(--color-gold)]/40 bg-[color:var(--color-gold)]/8 px-3 py-2">
      <p className="font-display text-sm italic text-[color:var(--color-espresso)]">
        {items.join(", ")}
      </p>
      {args.note && (
        <p className="mt-0.5 font-display text-xs italic text-[color:var(--color-charcoal)]">
          “{args.note}”
        </p>
      )}
    </div>
  );
}

// ──────────── F&B ────────────

function FnbReservation({ args }: { args: { restaurantId?: string; time?: string; partySize?: number; notes?: string } }) {
  return (
    <div className="rounded-lg border border-[color:var(--color-clay)]/30 bg-[color:var(--color-clay)]/6 px-3 py-2">
      <div className="flex items-center justify-between">
        <span className="font-display text-base leading-tight text-[color:var(--color-espresso)]">
          {(args.restaurantId ?? "—").replace(/-/g, " ")}
        </span>
        <Pill tone="clay">
          {args.time} · {args.partySize} pax
        </Pill>
      </div>
      {args.notes && (
        <p className="mt-1 font-display text-xs italic text-[color:var(--color-charcoal)]">
          “{args.notes}”
        </p>
      )}
    </div>
  );
}

function FnbAvailability({ result }: { result: string }) {
  // Result is a sentence like "Available at 19:30 for 4." or "Not available at 19:30. Alternatives: 18:30, 21:00"
  const ok = /available/i.test(result) && !/not available/i.test(result);
  return (
    <div className={`rounded-lg border px-3 py-1.5 ${ok ? "border-[color:var(--color-sage)]/40 bg-[color:var(--color-sage)]/10" : "border-[color:var(--color-clay)]/40 bg-[color:var(--color-clay)]/8"}`}>
      <p className="font-display text-sm italic text-[color:var(--color-espresso)]">{result}</p>
    </div>
  );
}

// ──────────── Spa ────────────

function SpaBook({ args }: { args: Record<string, string> }) {
  return (
    <div className="flex items-center gap-2 rounded-lg border border-[color:var(--color-stone-light)] bg-white/60 px-3 py-2">
      <Pill tone="sage">booked</Pill>
      <span className="font-mono text-[10px] uppercase tracking-wider text-[color:var(--color-charcoal)]">
        {args.slotId}
      </span>
    </div>
  );
}

// ──────────── Registry ────────────

const RENDERERS: Record<
  string,
  (input: { args: Record<string, unknown>; result: string }) => React.ReactNode
> = {
  pms_get_guest_by_name: ({ result }) => <PmsGuestLookup result={result} />,
  pms_get_room: ({ result }) => <PmsGetRoom result={result} />,
  pms_list_available_rooms: ({ result }) => <PmsListAvailableRooms result={result} />,
  pms_reassign_guest_room: ({ args, result }) => (
    <PmsReassignRoom args={args as Record<string, string>} _result={result} />
  ),
  hk_schedule_cleaning: ({ args }) => <HkScheduleCleaning args={args as Record<string, string>} />,
  hk_create_amenity_ticket: ({ args }) => <HkAmenity args={args as { items?: string[]; note?: string }} />,
  fnb_make_reservation: ({ args }) => (
    <FnbReservation args={args as { restaurantId?: string; time?: string; partySize?: number; notes?: string }} />
  ),
  fnb_check_availability: ({ result }) => <FnbAvailability result={result} />,
  spa_book_slot: ({ args }) => <SpaBook args={args as Record<string, string>} />,
};

export function ToolResult({ data }: { data: ToolCallCardData }) {
  if (data.status !== "done") return null;
  const renderer = RENDERERS[data.tool];
  if (!renderer) return null;
  const args = tryParse<Record<string, unknown>>(data.args) ?? {};
  const result = data.resultPreview ?? "";
  return <div className="mt-1.5">{renderer({ args, result })}</div>;
}
