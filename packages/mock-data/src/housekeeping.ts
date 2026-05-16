import { store, type HousekeepingTask, type AmenityTicket } from "./store.ts";

let taskCounter = 100;

export function scheduleCleaning(input: {
  roomId: string;
  type: HousekeepingTask["type"];
  priority?: HousekeepingTask["priority"];
  scheduledFor?: string;
  notes?: string;
}): { ok: boolean; task?: HousekeepingTask; error?: string } {
  const room = store.rooms.get(input.roomId);
  if (!room) return { ok: false, error: `Room ${input.roomId} not found` };

  const id = `hk-${++taskCounter}`;
  const task: HousekeepingTask = {
    id,
    roomId: input.roomId,
    type: input.type,
    priority: input.priority ?? "normal",
    status: "scheduled",
    scheduledFor: input.scheduledFor,
    notes: input.notes,
    assignedTo: input.priority === "urgent" ? "Lead team (Elena)" : "Standard rotation",
  };
  store.housekeeping.set(id, task);

  if (input.type === "deep_clean" && room.status === "vacant_dirty") {
    room.status = "deep_clean_required";
    store.rooms.set(room.id, room);
  }

  store.log("housekeeping", "schedule_cleaning", {
    taskId: id,
    room: room.number,
    type: input.type,
    priority: task.priority,
    scheduledFor: input.scheduledFor,
  });
  return { ok: true, task };
}

export function rerouteTeam(input: { fromRoomId: string; toRoomId: string; reason: string }): {
  ok: boolean;
  error?: string;
} {
  const from = store.rooms.get(input.fromRoomId);
  const to = store.rooms.get(input.toRoomId);
  if (!from || !to) return { ok: false, error: "Room not found" };
  store.log("housekeeping", "reroute_team", {
    from: from.number,
    to: to.number,
    reason: input.reason,
  });
  return { ok: true };
}

let amenityCounter = 200;

export function createAmenityTicket(input: {
  roomId: string;
  guestId: string;
  items: string[];
  note?: string;
}): { ok: boolean; ticket?: AmenityTicket; error?: string } {
  const room = store.rooms.get(input.roomId);
  const guest = store.guests.get(input.guestId);
  if (!room) return { ok: false, error: "Room not found" };
  if (!guest) return { ok: false, error: "Guest not found" };

  const id = `am-${++amenityCounter}`;
  const ticket: AmenityTicket = {
    id,
    roomId: input.roomId,
    guestId: input.guestId,
    items: input.items,
    note: input.note,
    status: "queued",
  };
  store.amenities.set(id, ticket);
  store.log("housekeeping", "create_amenity_ticket", {
    ticketId: id,
    room: room.number,
    guest: guest.primaryName,
    items: input.items,
    note: input.note,
  });
  return { ok: true, ticket };
}

export function listTasks(): HousekeepingTask[] {
  return [...store.housekeeping.values()];
}
