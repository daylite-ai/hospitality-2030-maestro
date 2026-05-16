/**
 * Maestro Operator — staff-facing mobile surface at /operator.
 *
 * Design rules (per May-2026 hospitality-ops UX research):
 *   - One Big Card at a time. No scrolling backlog.
 *   - Brutalist dark mode (OLED-friendly in dim back-of-house hallways).
 *   - Massive serif room number readable from 8 feet across a cart.
 *   - Forbes-grade PII stripping — staff sees the preference constraint,
 *     not the guest's name.
 *   - One interaction: swipe to complete. No tiny checkboxes, no menus.
 *   - HK / F&B toggle at top (zero-auth "demo god mode").
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTraceStream } from "@/hooks/useTraceStream";
import { deriveOperatorTasks, type Department } from "./operator/derive";
import { NowUpCard } from "./operator/NowUpCard";
import { SwipeToComplete } from "./operator/SwipeToComplete";

const ORCH = "http://localhost:4000";

async function postAck(callId: string, system: "housekeeping" | "fnb") {
  await fetch(`${ORCH}/api/operator/ack`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ callId, system, ackedBy: system }),
  }).catch(() => undefined);
}

const DEPT_LABEL: Record<Department, string> = {
  housekeeping: "Housekeeping",
  fnb: "Food & Beverage",
};

export default function OperatorApp() {
  const { events, connected } = useTraceStream();
  const [dept, setDept] = useState<Department>("housekeeping");

  const tasks = useMemo(() => deriveOperatorTasks(events), [events]);
  const queue = tasks[dept];
  const nowUp = queue[0] ?? null;

  return (
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <header className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-500">
            Maestro · Operator
          </p>
          <p className="font-display text-lg italic text-zinc-300">
            {DEPT_LABEL[dept]}
          </p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          <span
            className={
              "size-1.5 rounded-full " + (connected ? "bg-emerald-400" : "bg-zinc-600")
            }
          />
          {connected ? "live" : "offline"}
        </span>
      </header>

      <DeptToggle value={dept} onChange={setDept} />

      <div className="flex-1 px-5 pt-3">
        <NowUpCard task={nowUp} />

        {queue.length > 1 && (
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-zinc-600">
            +{queue.length - 1} queued
          </p>
        )}
      </div>

      <div className="px-5 pb-7">
        {nowUp && (
          <SwipeToComplete
            onComplete={() => {
              void postAck(nowUp.callId, dept);
            }}
          />
        )}
      </div>
    </div>
  );
}

function DeptToggle({
  value,
  onChange,
}: {
  value: Department;
  onChange: (d: Department) => void;
}) {
  const options: Department[] = ["housekeeping", "fnb"];
  return (
    <div className="mx-5 mt-5 grid grid-cols-2 rounded-2xl border border-zinc-800 bg-zinc-900/60 p-1">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="relative z-10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.32em] text-zinc-400"
          >
            {active && (
              <motion.span
                layoutId="dept-toggle-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-white/95"
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
              />
            )}
            <span className={active ? "text-zinc-900" : ""}>
              {opt === "housekeeping" ? "HK" : "F&B"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
