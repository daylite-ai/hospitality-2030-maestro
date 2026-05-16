import { store, type Restaurant, type FnbReservation } from "./store.ts";

let resCounter = 500;

export function listRestaurants(): Restaurant[] {
  return [...store.restaurants.values()];
}

export function getRestaurant(id: string): Restaurant | null {
  return store.restaurants.get(id) ?? null;
}

export function checkAvailability(input: {
  restaurantId: string;
  time: string;
  partySize: number;
}): { ok: boolean; available: boolean; alternatives?: string[]; error?: string } {
  const r = store.restaurants.get(input.restaurantId);
  if (!r) return { ok: false, available: false, error: "Restaurant not found" };

  const seatsAtTime = r.bookedSlots
    .filter((s) => s.time === input.time)
    .reduce((acc, s) => acc + s.partySize, 0);
  const remaining = r.capacity - seatsAtTime;
  const available = remaining >= input.partySize;

  let alternatives: string[] | undefined;
  if (!available) {
    const hourBlocks = ["18:30", "19:00", "19:30", "20:00", "20:30", "21:00"];
    alternatives = hourBlocks.filter((t) => {
      if (t === input.time) return false;
      const taken = r.bookedSlots
        .filter((s) => s.time === t)
        .reduce((a, s) => a + s.partySize, 0);
      return r.capacity - taken >= input.partySize;
    });
  }

  return { ok: true, available, alternatives };
}

export function makeReservation(input: {
  restaurantId: string;
  guestId: string;
  time: string;
  partySize: number;
  notes?: string;
}): { ok: boolean; reservation?: FnbReservation; error?: string } {
  const r = store.restaurants.get(input.restaurantId);
  const g = store.guests.get(input.guestId);
  if (!r) return { ok: false, error: "Restaurant not found" };
  if (!g) return { ok: false, error: "Guest not found" };

  const avail = checkAvailability({
    restaurantId: input.restaurantId,
    time: input.time,
    partySize: input.partySize,
  });
  if (!avail.available) {
    return {
      ok: false,
      error: `${r.name} not available at ${input.time}. Try: ${(avail.alternatives ?? []).join(", ")}`,
    };
  }

  const id = `res-${++resCounter}`;
  const reservation: FnbReservation = {
    id,
    restaurantId: input.restaurantId,
    guestId: input.guestId,
    time: input.time,
    partySize: input.partySize,
    notes: input.notes,
  };
  store.fnbReservations.set(id, reservation);
  r.bookedSlots.push({ time: input.time, partySize: input.partySize, reservationId: id });
  store.restaurants.set(r.id, r);

  store.log("fnb", "make_reservation", {
    reservationId: id,
    restaurant: r.name,
    guest: g.primaryName,
    time: input.time,
    partySize: input.partySize,
    notes: input.notes,
  });

  return { ok: true, reservation };
}
