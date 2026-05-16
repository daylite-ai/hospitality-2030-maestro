/**
 * Housekeeping MCP server.
 *
 * Cleaning tasks, team rerouting, amenity tickets.
 */
import { startStdioServer, safeHandler, z } from "@maestro/mcp-helpers";
import { housekeeping } from "@maestro/mock-data";

await startStdioServer(
  { name: "rosewood-housekeeping", version: "0.1.0", label: "Housekeeping" },
  (server) => {
    server.registerTool(
      "hk_schedule_cleaning",
      {
        title: "Schedule a cleaning task",
        description:
          "Create a cleaning task for a specific room. Use 'deep_clean' for rooms that need extra time (e.g. wine spills); 'turndown' for nightly service.",
        inputSchema: {
          roomId: z.string(),
          type: z.enum(["turndown", "deep_clean", "linens", "amenity_delivery", "glassware"]),
          priority: z.enum(["low", "normal", "urgent"]).optional(),
          scheduledFor: z.string().optional().describe("ISO 8601 timestamp"),
          notes: z.string().optional(),
        },
      },
      safeHandler(
        async (input: {
          roomId: string;
          type: "turndown" | "deep_clean" | "linens" | "amenity_delivery" | "glassware";
          priority?: "low" | "normal" | "urgent";
          scheduledFor?: string;
          notes?: string;
        }) => {
          const r = housekeeping.scheduleCleaning(input);
          if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
          return {
            ok: true,
            text: `Task ${r.task?.id}: ${r.task?.type} for room scheduled (${r.task?.priority}, ${r.task?.scheduledFor ?? "asap"})`,
          };
        },
      ),
    );

    server.registerTool(
      "hk_reroute_team",
      {
        title: "Reroute housekeeping team to a different room",
        description: "Inform the cleaning team to handle a different room than originally assigned. Logs the reason.",
        inputSchema: { fromRoomId: z.string(), toRoomId: z.string(), reason: z.string() },
      },
      safeHandler(async (input: { fromRoomId: string; toRoomId: string; reason: string }) => {
        const r = housekeeping.rerouteTeam(input);
        if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
        return { ok: true, text: "Team rerouted." };
      }),
    );

    server.registerTool(
      "hk_create_amenity_ticket",
      {
        title: "Create an in-room amenity delivery ticket",
        description:
          "Queue a personalised welcome amenity (flowers, kid's gift, handwritten card, dietary snack) for delivery to a guest's room. Use rich `note` text to brief the staffer preparing it.",
        inputSchema: {
          roomId: z.string(),
          guestId: z.string(),
          items: z.array(z.string()).min(1),
          note: z.string().optional().describe("Specific personal note for the prep team."),
        },
      },
      safeHandler(
        async (input: { roomId: string; guestId: string; items: string[]; note?: string }) => {
          const r = housekeeping.createAmenityTicket(input);
          if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
          return { ok: true, text: `Amenity ticket ${r.ticket?.id} queued.` };
        },
      ),
    );

    server.registerTool(
      "hk_list_tasks",
      {
        title: "List all current housekeeping tasks",
        description: "Returns every active and pending housekeeping task.",
        inputSchema: {},
      },
      safeHandler(async () => {
        return { ok: true, text: JSON.stringify(housekeeping.listTasks(), null, 2) };
      }),
    );
  },
);
