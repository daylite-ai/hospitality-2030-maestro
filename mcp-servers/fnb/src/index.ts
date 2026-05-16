/**
 * F&B (Food & Beverage) MCP server.
 *
 * Restaurant availability and reservations across Madera, Madera Bar, Mayfield.
 */
import { startStdioServer, safeHandler, z } from "@maestro/mcp-helpers";
import { fnb } from "@maestro/mock-data";

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
        description: "Book a table for a known guest. Include a note when special considerations apply (kids, dietary, dealmaking).",
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
          const r = fnb.makeReservation(input);
          if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
          return { ok: true, text: `Reservation ${r.reservation?.id} confirmed at ${r.reservation?.time}.` };
        },
      ),
    );
  },
);
