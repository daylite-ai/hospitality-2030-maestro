/**
 * PMS (Property Management System) MCP server.
 *
 * Guest records, room state, reassignment.
 */
import { startStdioServer, safeHandler, z } from "@maestro/mcp-helpers";
import { pms } from "@maestro/mock-data";
import { store } from "@maestro/mock-data/store";

await startStdioServer(
  { name: "rosewood-pms", version: "0.1.0", label: "Property Management" },
  (server) => {
    server.registerTool(
      "pms_get_guest_by_name",
      {
        title: "Look up guest by name",
        description:
          "Find a guest record (loyalty tier, party, preferences, history, current room) by primary name OR any party-member name. Use this whenever staff mentions a guest by name.",
        inputSchema: { name: z.string().min(1).describe("Any name in the booking party, e.g. 'Karp' or 'Maya Karp'") },
      },
      safeHandler(async ({ name }: { name: string }) => {
        const g = pms.findGuestByName(name);
        if (!g) return { ok: false, text: `No guest matching "${name}" found.` };
        return { ok: true, text: JSON.stringify(g, null, 2) };
      }),
    );

    server.registerTool(
      "pms_get_room",
      {
        title: "Get room state",
        description: "Fetch a room's current status, type, assigned guest, and notes by internal ID or visible number.",
        inputSchema: { roomIdOrNumber: z.string().describe("Internal id (r-12) or visible number ('12', 'Villa 3')") },
      },
      safeHandler(async ({ roomIdOrNumber }: { roomIdOrNumber: string }) => {
        const r = pms.getRoom(roomIdOrNumber) ?? pms.findRoomByNumber(roomIdOrNumber);
        if (!r) return { ok: false, text: `Room ${roomIdOrNumber} not found.` };
        return { ok: true, text: JSON.stringify(r, null, 2) };
      }),
    );

    server.registerTool(
      "pms_list_available_rooms",
      {
        title: "List vacant clean rooms",
        description: "List rooms currently vacant_clean (immediately available). Optionally filter by type.",
        inputSchema: { type: z.enum(["deluxe", "suite", "villa"]).optional() },
      },
      safeHandler(async ({ type }: { type?: "deluxe" | "suite" | "villa" }) => {
        const rooms = pms.listAvailableRooms(type);
        return { ok: true, text: JSON.stringify(rooms, null, 2) };
      }),
    );

    server.registerTool(
      "pms_reassign_guest_room",
      {
        title: "Reassign a guest to a different room",
        description:
          "Move a guest from their currently assigned room to a different vacant-clean room. Use when the originally assigned room is unavailable and a substitute meets the guest's preferences.",
        inputSchema: {
          guestId: z.string(),
          newRoomId: z.string(),
          reason: z.string().describe("Short staff-facing reason for the audit log"),
        },
      },
      safeHandler(async ({ guestId, newRoomId, reason }: { guestId: string; newRoomId: string; reason: string }) => {
        const r = pms.reassignGuestRoom(guestId, newRoomId);
        if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
        store.log("pms", "reassign_reason", { guestId, reason });
        return {
          ok: true,
          text: `Reassigned ${r.guest?.primaryName} from room ${r.oldRoom?.number ?? "(none)"} to ${r.newRoom?.number}.`,
        };
      }),
    );

    server.registerTool(
      "pms_update_guest_eta",
      {
        title: "Update guest arrival ETA",
        description: "Update a guest's expected arrival time (ISO 8601).",
        inputSchema: { guestId: z.string(), eta: z.string() },
      },
      safeHandler(async ({ guestId, eta }: { guestId: string; eta: string }) => {
        const r = pms.updateGuestEta(guestId, eta);
        if (!r.ok) return { ok: false, text: r.error ?? "Failed" };
        return { ok: true, text: "ETA updated." };
      }),
    );
  },
);
