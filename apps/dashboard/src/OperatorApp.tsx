/**
 * Maestro Operator — staff-facing mobile surface at /operator.
 *
 * Design rules (per May-2026 luxury hospitality-ops UX research, with
 * Alice by Actabl + Optii as the reference set):
 *   - One Big Card at a time. No scrolling backlog.
 *   - Alabaster (NOT dark) — Forbes-tier luxury reads tactile + high-
 *     contrast in 2026, not OLED-bro.
 *   - Massive serif room number readable across a cart.
 *   - Forbes-grade PII stripping — staff sees the preference, not the
 *     guest's name.
 *   - One interaction: long-press to acknowledge (300ms hold).
 *   - HK / F&B segmented toggle at top (zero-auth "demo god mode").
 *   - Property tag "Rosewood Sand Hill · Housekeeping" in footer
 *     small-caps to telegraph "real product" not "developer demo".
 */

import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { useTraceStream } from "@/hooks/useTraceStream";
import { deriveOperatorTasks, type Department } from "./operator/derive";
import { NowUpCard } from "./operator/NowUpCard";
import { LongPressAck } from "./operator/LongPressAck";

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
    <div className="mx-auto flex h-[100dvh] max-w-md flex-col overflow-hidden bg-[#EFE9DD] text-[#1A1A1A]">
      <header className="flex items-center justify-between px-5 pt-6">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.34em] text-[#1A1A1A]/45">
            Maestro · Operator
          </p>
          <p className="font-display text-lg italic leading-tight text-[#1A1A1A]/75">
            {DEPT_LABEL[dept]}
          </p>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/45">
          <span
            className={
              "size-1.5 rounded-full " + (connected ? "bg-[#2C3E2C]" : "bg-[#1A1A1A]/30")
            }
          />
          {connected ? "live" : "offline"}
        </span>
      </header>

      <DeptToggle value={dept} onChange={setDept} />

      <div className="flex-1 px-5 pt-3">
        <NowUpCard task={nowUp} />

        {queue.length > 1 && (
          <p className="mt-4 text-center font-mono text-[10px] uppercase tracking-[0.32em] text-[#1A1A1A]/35">
            +{queue.length - 1} queued
          </p>
        )}
      </div>

      <div className="px-5">
        {nowUp ? (
          <LongPressAck
            onComplete={() => {
              void postAck(nowUp.callId, dept);
            }}
          />
        ) : (
          <div className="h-20" />
        )}
      </div>

      <footer className="px-5 pb-6 pt-4">
        <p className="text-center font-mono text-[9.5px] uppercase tracking-[0.36em] text-[#1A1A1A]/40">
          Rosewood Sand Hill · {DEPT_LABEL[dept]}
        </p>
      </footer>
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
    <div className="mx-5 mt-5 grid grid-cols-2 rounded-2xl border border-[#1A1A1A]/12 bg-[#F5F1EA] p-1">
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(opt)}
            className="relative z-10 px-3 py-2 font-mono text-[11px] uppercase tracking-[0.32em]"
          >
            {active && (
              <motion.span
                layoutId="dept-toggle-pill"
                className="absolute inset-0 -z-10 rounded-xl bg-[#1A1A1A]"
                transition={{ type: "spring", stiffness: 360, damping: 28 }}
              />
            )}
            <span className={active ? "text-[#F5F1EA]" : "text-[#1A1A1A]/45"}>
              {opt === "housekeeping" ? "HK" : "F&B"}
            </span>
          </button>
        );
      })}
    </div>
  );
}
