# Prompting & loop discipline

The notes that explain *why* the Karp turn lands clean and the Madera
recovery lands without thrashing.

## 1. The `<thinking>` block (mandated, not suggested)

Opus 4.7 hallucinates JSON when forced to emit `tool_use` blocks
without a scratchpad. The model calls it *attention collapse*. The
GM-persona system prompt makes a `<thinking>` block **mandatory** at
the top of every turn that involves tools:

> Every turn that involves tools MUST begin with a brief `<thinking>`
> block, followed by tool calls, followed eventually by your single
> spoken confirmation. The `<thinking>` block stays under 100 words
> and lists: which guests/rooms/systems are involved; which tools
> you need to invoke in what dependency order; what state-change
> you intend to land.

The block is hidden from the GM-facing UI. Judges who want to see
it open the **"Why?" drawer** (Shift+?) or **X-Ray** (Alt+X).

## 2. Parallel reads, serial writes

Opus 4.7 emits multiple `tool_use` blocks per turn. The orchestrator
splits them into two lanes via a static taxonomy:

```
READ-ONLY       — Promise.all (parallel)
STATE-MUTATING  — sequential await loop
```

The taxonomy lives in `apps/orchestrator/src/claude-loop.ts`:

```ts
const READ_ONLY_TOOLS = new Set([
  "pms_get_guest_by_name",
  "pms_get_room",
  "pms_list_available_rooms",
  "fnb_list_restaurants",
  "fnb_check_availability",
  "spa_list_availability",
  "hk_list_tasks",
]);
```

The prompt also instructs Opus not to mix the two within a single
turn, but the code is the belt-and-suspenders defence. Naïve
`Promise.all` over all tool_use blocks would race two writes against
the same record (the Karp scenario can easily produce
`pms_list_available_rooms` + `pms_reassign_guest_room` in one turn);
the split lanes mean a stage demo never hits a same-record race.

## 3. Failure classification

When a tool returns `isError`, Claude is taught to classify before
acting:

* **Model's-fault** (bad argument, wrong ID) → correct the argument and
  retry the same tool, once.
* **Third-party outage** (HTTP 503, "API unreachable", "kitchen system
  offline") → **do NOT retry the same endpoint.** Pick an alternate
  resource from the fall-back map and call the tool again.

The fall-back map lives in the system prompt:

```
Madera (main dining)        →  Mayfield Bakery → Madera Bar
Madera Bar (cocktails)      →  in-room dining via hk_create_amenity_ticket
Mayfield Bakery (breakfast) →  in-room dining
Asaya Spa (treatments)      →  reschedule to next slot
```

This is what powers the recovery demo. When `fnb_make_reservation`
gets a one-shot HTTP-503 against Madera (chaos injected by
`admin_inject_chaos`), Claude reads the failure, classifies it as
infrastructure, picks Mayfield from the map, books it, and surfaces
the failover in the final spoken confirmation ("Madera was offline,
so the family is going to Mayfield instead").

## 4. Explicit `tool_use ↔ tool_result` pairing

A turn-completion bug in the wild: Opus 4.7 emits N `tool_use`
blocks; the orchestrator only returns N − 1 `tool_result`s; the
next call to `messages.create` rejects the conversation as
malformed. Symptom: the loop dies silently in the middle of a
fan-out, leaving an orphan card on the dashboard.

The orchestrator's defence: after running both lanes, results are
re-assembled in the **original Anthropic order** and pushed as a
single `user` message containing one `tool_result` block per
`tool_use` block, keyed by `tool_use_id`. No orphans possible.

```ts
const resultByCallId = new Map(
  [...readResults, ...writeResults].map((r) => [r.block.id, r] as const),
);
const results = toolUses.map((b) => resultByCallId.get(b.id)!);
messages.push({
  role: "user",
  content: results.map(({ block, result }) => ({
    type: "tool_result",
    tool_use_id: block.id,
    content: result.text,
    is_error: !result.ok,
  })),
});
```

## 5. Output size cap

Every tool result is truncated to 12 000 characters (~3 K tokens)
before going back into the conversation. Without this, a chatty
`pms_list_available_rooms` blew past 50 K tokens on edge cases and
inflated subsequent latencies. The cap appends a visible marker so
the model knows it didn't get the full payload:

```
…(truncated 38_293 chars)
```

## 6. Admin tool hiding

Demo control tools (`admin_inject_chaos`, `admin_advance_guest_eta`)
are registered on the MCP servers (routable by the orchestrator),
but their definitions are stripped from the tool list
Claude sees:

```ts
function isAdminTool(name: string): boolean {
  return name.startsWith("admin_");
}
// ...
return tools.filter((t) => !isAdminTool(t.name)).map(...);
```

This keeps Claude from accidentally calling a demo hook in the middle
of a real reasoning chain.

## 7. Mid-stream interrupt (the barge-in pattern)

The GM can interrupt Claude mid-fan-out via Cmd+I / `POST /api/interrupt`.
Under the hood:

* `InterruptController` wraps `AbortController` + a one-shot reason
  string (the GM's new utterance).
* The Anthropic stream's `signal` is passed through; abort cleanly
  bubbles via try/catch around the `for await` loop.
* The orchestrator re-enters `runTurn` with the prior message history
  **merged into the last user message** (Anthropic requires strict
  user/assistant alternation; if the last message is `user`-role
  tool_results, the next user turn must be appended into it, not
  pushed as a separate message).

The transcript broadcast on re-entry uses `speaker = "gm"` so the
dashboard appends a clay-tinted "GM interjects" line instead of
clearing the fan-out for a fresh turn.

---

## What is NOT in this prompt

* No few-shot examples — the prompt is purely directive.
* No JSON-mode forcing — Anthropic's tool-use schema validation is
  enough.
* No CoT scratchpad outside the `<thinking>` block — Opus 4.7
  doesn't need it.
* No model-version negotiation — we pin to `claude-opus-4-7` via
  `ANTHROPIC_MODEL` env var.

If you want to read the actual prompt:
[`apps/orchestrator/src/prompts.ts`](apps/orchestrator/src/prompts.ts).
