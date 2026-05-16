import { motion } from "motion/react";
import type { System } from "@maestro/protocol";
import { Card } from "@/components/ui/card";
import { Pill, SystemBadge } from "@/components/ui/badge";
import { previewJson } from "@/lib/utils";
import { ToolResult } from "./ResultRenderer";

// Tools that have a hand-built ResultRenderer below. For these we skip the
// raw JSON args/result preview entirely; the micro-state card is the message.
const TOOLS_WITH_CUSTOM_RENDER = new Set([
  "pms_get_guest_by_name",
  "pms_list_available_rooms",
  "pms_reassign_guest_room",
  "hk_schedule_cleaning",
  "hk_create_amenity_ticket",
  "fnb_make_reservation",
  "fnb_check_availability",
  "spa_book_slot",
]);

const SYSTEM_LABELS: Record<System, string> = {
  pms: "PMS",
  housekeeping: "Housekeeping",
  fnb: "F & B",
  spa: "Asaya Spa",
};

const TOOL_TITLES: Record<string, string> = {
  pms_get_guest_by_name: "Look up guest",
  pms_get_room: "Inspect room",
  pms_list_available_rooms: "Survey vacancies",
  pms_reassign_guest_room: "Reassign suite",
  pms_update_guest_eta: "Update arrival ETA",
  hk_schedule_cleaning: "Schedule cleaning",
  hk_reroute_team: "Reroute team",
  hk_create_amenity_ticket: "Queue amenity",
  hk_list_tasks: "Review tasks",
  fnb_list_restaurants: "List restaurants",
  fnb_check_availability: "Check table",
  fnb_make_reservation: "Book table",
  spa_list_availability: "Survey spa slots",
  spa_book_slot: "Book treatment",
};

export interface ToolCallCardData {
  callId: string;
  system: System;
  tool: string;
  args: unknown;
  status: "active" | "done" | "error";
  durationMs?: number;
  resultPreview?: string;
}

export function ToolCallCard({ data }: { data: ToolCallCardData }) {
  const title = TOOL_TITLES[data.tool] ?? data.tool;
  const argPreview = previewJson(data.args, 2);

  return (
    <motion.div
      layout
      layoutId={data.callId}
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <Card className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <SystemBadge system={data.system} label={SYSTEM_LABELS[data.system]} />
          {data.status === "active" ? (
            <Pill variant="active">
              <Spinner /> live
            </Pill>
          ) : data.status === "done" ? (
            <Pill variant="success">
              ✓ {data.durationMs ?? 0} ms
            </Pill>
          ) : (
            <Pill variant="error">! {data.durationMs ?? 0} ms</Pill>
          )}
        </div>

        <h3 className="font-display text-lg leading-tight text-[color:var(--color-espresso)]">
          {title}
        </h3>

        {data.status === "active" && (
          <div className="rounded-md bg-[color:var(--color-alabaster-deep)] px-2.5 py-1.5 font-mono text-[10.5px] italic text-[color:var(--color-stone)]">
            Generating payload…
          </div>
        )}

        {data.status !== "active" && TOOLS_WITH_CUSTOM_RENDER.has(data.tool) && (
          <ToolResult data={data} />
        )}

        {data.status !== "active" && !TOOLS_WITH_CUSTOM_RENDER.has(data.tool) && argPreview && (
          <pre className="rounded-md bg-[color:var(--color-alabaster-deep)] px-2.5 py-1.5 font-mono text-[10.5px] leading-snug text-[color:var(--color-charcoal)] whitespace-pre-wrap break-words">
            {argPreview}
          </pre>
        )}

        {data.status !== "active" && !TOOLS_WITH_CUSTOM_RENDER.has(data.tool) && data.resultPreview && (
          <p className="line-clamp-2 text-xs leading-snug text-[color:var(--color-espresso-soft)]">
            {data.resultPreview.slice(0, 160)}
          </p>
        )}
      </Card>
    </motion.div>
  );
}

function Spinner() {
  return (
    <svg className="size-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="3" strokeOpacity="0.25" />
      <path
        d="M21 12a9 9 0 0 0-9-9"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
}
