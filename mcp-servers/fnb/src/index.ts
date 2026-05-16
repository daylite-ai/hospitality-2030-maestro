/**
 * F&B (Food & Beverage) MCP server.
 *
 * Restaurant availability and reservations across Madera, Madera Bar, Mayfield.
 *
 * Includes a demo-time chaos injector — admin_inject_chaos can be called by
 * the orchestrator to simulate a single 503 against Madera so Claude has to
 * autonomously fail-over to an alternate venue. This is the recovery-demo
 * "money moment" the Greycroft Systems-of-Action thesis specifically rewards.
 */
import { startStdioServer, safeHandler, z } from "@maestro/mcp-helpers";
import { fnb } from "@maestro/mock-data";

// Process-local chaos state. Survives across tool calls, wiped when the
// parent orchestrator respawns the child via /api/reset.
const chaos = {
  failNextMaderaReservation: false,
};

await startStdioServer(
  { name: "rosewood-fnb", version: "0.1.0", label: "Food & Beverage" },
  (server) => {
    server.registerTool(
      "fnb_list_restaurants",
      {
        title: "List on-property restaurants",
        description: "Returns all restaurants with cuisine, hours, capacity.",
        inputSchema: {},
      },
      safeHandler(async () => ({ ok: true, text: JSON.stringify(fnb.listRestaurants(), null, 2) })),
    );

    server.registerTool(
      "fnb_check_availability",
      {
        title: "Check restaurant availability",
        description:
          "Check whether a restaurant has capacity for a party at a given time. If not, returns alternative time slots.",
        inputSchema: {
          restaurantId: z.string().describe("e.g. 'madera', 'madera-bar', 'mayfield'"),
          time: z.string().describe("Local time like '19:30'"),
          partySize: z.number().int().min(1),
        },
      },
      safeHandler(async (input: { restaurantId: string; time: string; partySize: number }) => {
        const r = fnb.checkAvailability(input);
        if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
        if (r.available) return { ok: true, text: `Available at ${input.time} for ${input.partySize}.` };
        return {
          ok: true,
          text: `Not available at ${input.time}. Alternatives: ${(r.alternatives ?? []).join(", ") || "(none)"}`,
        };
      }),
    );

    server.registerTool(
      "fnb_make_reservation",
      {
        title: "Make a restaurant reservation",
        description:
          "Book a table for a known guest. Include a note when special considerations apply (kids, dietary, dealmaking).",
        inputSchema: {
          restaurantId: z.string(),
          guestId: z.string(),
          time: z.string(),
          partySize: z.number().int().min(1),
          notes: z.string().optional(),
        },
      },
      safeHandler(
        async (input: { restaurantId: string; guestId: string; time: string; partySize: number; notes?: string }) => {
          // Demo-time chaos: simulate Madera's reservation API going dark
          // exactly once so Claude has to re-plan to Mayfield Bakery (or
          // Madera Bar, depending on context).
          if (input.restaurantId === "madera" && chaos.failNextMaderaReservation) {
            chaos.failNextMaderaReservation = false;
            process.stderr.write(`[fnb] chaos hit — refusing Madera reservation with 503\n`);
            return {
              ok: false,
              text:
                "HTTP 503: Madera reservation API is currently unreachable. The kitchen system reports a transient outage. " +
                "Pick a different venue (madera-bar, mayfield) and retry — the guest must still be served.",
            };
          }

          const r = fnb.makeReservation(input);
          if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
          return { ok: true, text: `Reservation ${r.reservation?.id} confirmed at ${r.reservation?.time}.` };
        },
      ),
    );

    server.registerTool(
      "admin_inject_chaos",
      {
        title: "(internal) Inject a one-shot Madera 503",
        description:
          "Internal demo control. Arms a one-time failure for the next call to fnb_make_reservation that targets Madera. " +
          "The orchestrator calls this from /api/scenarios/recovery right before firing the canned demo, so Claude must " +
          "autonomously detect the outage and re-plan to an alternate venue. NOT for general use.",
        inputSchema: {},
      },
      safeHandler(async () => {
        chaos.failNextMaderaReservation = true;
        process.stderr.write(`[fnb] chaos armed — next Madera reservation will 503\n`);
        return { ok: true, text: "Chaos armed: next Madera reservation will return 503." };
      }),
    );
  },
);
