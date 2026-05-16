import { store, type Guest, type Room } from "./store.ts";

export function getGuest(guestId: string): Guest | null {
  return store.guests.get(guestId) ?? null;
}

export function findGuestByName(name: string): Guest | null {
  const lower = name.toLowerCase();
  for (const g of store.guests.values()) {
    if (g.primaryName.toLowerCase().includes(lower)) return g;
    if (g.party.some((p) => p.name.toLowerCase().includes(lower))) return g;
  }
  return null;
}

export function getRoom(roomId: string): Room | null {
  return store.rooms.get(roomId) ?? null;
}

export function findRoomByNumber(number: string): Room | null {
  for (const r of store.rooms.values()) {
    if (r.number === number) return r;
  }
  return null;
}

export function listAvailableRooms(type?: "deluxe" | "suite" | "villa"): Room[] {
  return [...store.rooms.values()].filter(
    (r) => r.status === "vacant_clean" && (!type || r.type === type),
  );
}

export function reassignGuestRoom(guestId: string, newRoomId: string): {
  ok: boolean;
  guest?: Guest;
  oldRoom?: Room;
  newRoom?: Room;
  error?: string;
} {
  const guest = store.guests.get(guestId);
  if (!guest) return { ok: false, error: `Guest ${guestId} not found` };
  const newRoom = store.rooms.get(newRoomId);
  if (!newRoom) return { ok: false, error: `Room ${newRoomId} not found` };
  if (newRoom.status !== "vacant_clean") {
    return { ok: false, error: `Room ${newRoom.number} is ${newRoom.status}, not vacant_clean` };
  }

  const oldRoomId = guest.currentRoomId;
  const oldRoom = oldRoomId ? store.rooms.get(oldRoomId) ?? undefined : undefined;
  if (oldRoom) {
    oldRoom.assignedGuestId = null;
    store.rooms.set(oldRoom.id, oldRoom);
  }

  newRoom.assignedGuestId = guest.id;
  newRoom.status = "occupied";
  guest.currentRoomId = newRoom.id;

  store.rooms.set(newRoom.id, newRoom);
  store.guests.set(guest.id, guest);

  store.log("pms", "reassign_guest_room", {
    guestId,
    guestName: guest.primaryName,
    from: oldRoom?.number,
    to: newRoom.number,
  });

  return { ok: true, guest, oldRoom, newRoom };
}

export function updateGuestEta(guestId: string, eta: string): { ok: boolean; error?: string } {
  const g = store.guests.get(guestId);
  if (!g) return { ok: false, error: "Guest not found" };
  g.arrivalEta = eta;
  store.guests.set(g.id, g);
  store.log("pms", "update_guest_eta", { guestId, eta });
  return { ok: true };
}
