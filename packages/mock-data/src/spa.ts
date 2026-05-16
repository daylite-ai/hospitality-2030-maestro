import { store, type SpaSlot } from "./store.ts";

export function listSpaAvailability(date?: string): SpaSlot[] {
  const filterDate = date ? new Date(date).toDateString() : new Date().toDateString();
  return [...store.spa.values()].filter(
    (s) => new Date(s.time).toDateString() === filterDate && !s.bookedBy,
  );
}

export function bookSpaSlot(input: { slotId: string; guestId: string }): {
  ok: boolean;
  slot?: SpaSlot;
  error?: string;
} {
  const slot = store.spa.get(input.slotId);
  const guest = store.guests.get(input.guestId);
  if (!slot) return { ok: false, error: "Spa slot not found" };
  if (!guest) return { ok: false, error: "Guest not found" };
  if (slot.bookedBy) return { ok: false, error: "Slot already booked" };

  slot.bookedBy = guest.id;
  store.spa.set(slot.id, slot);
  store.log("spa", "book_slot", {
    slotId: slot.id,
    treatment: slot.treatment,
    guest: guest.primaryName,
    time: slot.time,
  });
  return { ok: true, slot };
}
