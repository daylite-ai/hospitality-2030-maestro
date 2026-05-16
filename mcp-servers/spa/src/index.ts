/**
 * Spa MCP server (Asaya-style wellness center).
 */
import { startStdioServer, safeHandler, z } from "@maestro/mcp-helpers";
import { spa } from "@maestro/mock-data";

await startStdioServer(
  { name: "rosewood-spa", version: "0.1.0", label: "Asaya Spa" },
  (server) => {
    server.registerTool(
      "spa_list_availability",
      {
        title: "List today's spa availability",
        description: "Returns unbooked spa slots for a given date (defaults to today).",
        inputSchema: { date: z.string().optional().describe("ISO date, e.g. 2026-05-16") },
      },
      safeHandler(async ({ date }: { date?: string }) => {
        const slots = spa.listSpaAvailability(date);
        return { ok: true, text: JSON.stringify(slots, null, 2) };
      }),
    );

    server.registerTool(
      "spa_book_slot",
      {
        title: "Book a spa slot for a guest",
        description: "Reserve a specific spa slot for a known guest.",
        inputSchema: { slotId: z.string(), guestId: z.string() },
      },
      safeHandler(async (input: { slotId: string; guestId: string }) => {
        const r = spa.bookSpaSlot(input);
        if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
        return { ok: true, text: `Slot ${r.slot?.id} booked: ${r.slot?.treatment} at ${r.slot?.time}.` };
      }),
    );
  },
);
