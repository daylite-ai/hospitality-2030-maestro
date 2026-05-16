/**
 * Maestro in-memory store.
 *
 * Single source of truth for all 4 MCP servers in this demo monorepo.
 * In production each server would own its own database; for the hackathon
 * we share one store so dashboard can reflect state changes across all
 * systems in real time.
 *
 * Emits typed events for any mutation so the dashboard can render a live
 * "system state" panel without polling.
 */

import { EventEmitter } from "node:events";

export type System = "pms" | "housekeeping" | "fnb" | "spa";

export type RoomStatus =
  | "occupied"
  | "vacant_clean"
  | "vacant_dirty"
  | "out_of_service"
  | "deep_clean_required";

export interface Room {
  id: string;
  number: string;
  type: "deluxe" | "suite" | "villa";
  status: RoomStatus;
  assignedGuestId: string | null;
  notes: string;
}

export interface Guest {
  id: string;
  primaryName: string;
  party: { name: string; role: "primary" | "partner" | "child"; age?: number }[];
  loyaltyTier: "silver" | "gold" | "platinum" | "rosewood-elite";
  arrivalEta?: string;
  preferences: {
    diet?: string;
    sleep?: string;
    interests?: string[];
    notes?: string;
  };
  history: { stays: number; lastVisit?: string };
  currentRoomId: string | null;
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  type: "turndown" | "deep_clean" | "linens" | "amenity_delivery" | "glassware";
  priority: "low" | "normal" | "urgent";
  status: "pending" | "scheduled" | "in_progress" | "done";
  scheduledFor?: string;
  assignedTo?: string;
  notes?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  hours: string;
  capacity: number;
  bookedSlots: { time: string; partySize: number; reservationId: string }[];
}

export interface FnbReservation {
  id: string;
  restaurantId: string;
  guestId: string;
  time: string;
  partySize: number;
  notes?: string;
}

export interface SpaSlot {
  id: string;
  treatment: string;
  durationMin: number;
  time: string;
  therapist: string;
  bookedBy: string | null;
}

export interface AmenityTicket {
  id: string;
  roomId: string;
  guestId: string;
  items: string[];
  note?: string;
  status: "queued" | "delivered";
}

export interface AuditEntry {
  ts: string;
  system: System;
  action: string;
  detail: Record<string, unknown>;
}

class Store extends EventEmitter {
  rooms = new Map<string, Room>();
  guests = new Map<string, Guest>();
  housekeeping = new Map<string, HousekeepingTask>();
  restaurants = new Map<string, Restaurant>();
  fnbReservations = new Map<string, FnbReservation>();
  spa = new Map<string, SpaSlot>();
  amenities = new Map<string, AmenityTicket>();
  audit: AuditEntry[] = [];

  log(system: System, action: string, detail: Record<string, unknown> = {}) {
    const entry: AuditEntry = {
      ts: new Date().toISOString(),
      system,
      action,
      detail,
    };
    this.audit.push(entry);
    this.emit("audit", entry);
  }

  snapshot() {
    return {
      rooms: [...this.rooms.values()],
      guests: [...this.guests.values()],
      housekeeping: [...this.housekeeping.values()],
      restaurants: [...this.restaurants.values()],
      fnbReservations: [...this.fnbReservations.values()],
      spa: [...this.spa.values()],
      amenities: [...this.amenities.values()],
      audit: this.audit.slice(-50),
    };
  }

  reset() {
    this.rooms.clear();
    this.guests.clear();
    this.housekeeping.clear();
    this.restaurants.clear();
    this.fnbReservations.clear();
    this.spa.clear();
    this.amenities.clear();
    this.audit = [];
    seed(this);
    this.emit("reset");
  }
}

export const store = new Store();

function seed(s: Store) {
  // Rooms: 18 keys across deluxe / suite / villa
  const seedRooms: Room[] = [
    { id: "r-10", number: "10", type: "deluxe", status: "occupied", assignedGuestId: "g-blum", notes: "" },
    { id: "r-11", number: "11", type: "deluxe", status: "vacant_clean", assignedGuestId: null, notes: "" },
    { id: "r-12", number: "12", type: "suite", status: "vacant_dirty", assignedGuestId: "g-karp", notes: "Outgoing guest spilled red wine on rug." },
    { id: "r-14", number: "14", type: "suite", status: "vacant_clean", assignedGuestId: null, notes: "Sand Hill–facing, two bedrooms." },
    { id: "r-15", number: "15", type: "suite", status: "occupied", assignedGuestId: "g-okafor", notes: "" },
    { id: "r-16", number: "16", type: "suite", status: "vacant_clean", assignedGuestId: null, notes: "" },
    { id: "r-18", number: "18", type: "suite", status: "occupied", assignedGuestId: "g-cohen", notes: "" },
    { id: "r-villa-3", number: "Villa 3", type: "villa", status: "vacant_clean", assignedGuestId: null, notes: "Private terrace, plunge pool." },
  ];
  for (const r of seedRooms) s.rooms.set(r.id, r);

  // Guests
  const guests: Guest[] = [
    {
      id: "g-karp",
      primaryName: "David Karp",
      party: [
        { name: "David Karp", role: "primary" },
        { name: "Rachel Karp", role: "partner" },
        { name: "Maya Karp", role: "child", age: 8 },
        { name: "Noah Karp", role: "child", age: 12 },
      ],
      loyaltyTier: "rosewood-elite",
      arrivalEta: new Date(Date.now() + 1000 * 60 * 60 * 2).toISOString(),
      preferences: {
        diet: "Rachel is gluten-free; Maya prefers fruit plate over sweets.",
        sleep: "Blackout curtains; family prefers quieter Sand Hill–facing rooms.",
        interests: ["tennis", "early breakfast", "Stanford campus walk"],
        notes: "Maya (8) loves anything illustrated with horses; previously delighted by a hand-drawn welcome card.",
      },
      history: { stays: 6, lastVisit: "2025-12-18" },
      currentRoomId: "r-12",
    },
    {
      id: "g-cohen",
      primaryName: "Mr. Cohen",
      party: [{ name: "Mr. Cohen", role: "primary" }],
      loyaltyTier: "platinum",
      preferences: { diet: "Pescatarian.", interests: ["whisky", "late dinner"], notes: "Macallan 18 neat at Madera." },
      history: { stays: 11 },
      currentRoomId: "r-18",
    },
    {
      id: "g-okafor",
      primaryName: "Dr. Okafor",
      party: [{ name: "Dr. Okafor", role: "primary" }, { name: "Amara Okafor", role: "partner" }],
      loyaltyTier: "gold",
      preferences: { interests: ["spa", "tennis"] },
      history: { stays: 2 },
      currentRoomId: "r-15",
    },
    {
      id: "g-blum",
      primaryName: "Ms. Blum",
      party: [{ name: "Ms. Blum", role: "primary" }],
      loyaltyTier: "silver",
      preferences: { diet: "Vegan." },
      history: { stays: 1 },
      currentRoomId: "r-10",
    },
  ];
  for (const g of guests) s.guests.set(g.id, g);

  // Restaurants — Madera is the dealmaker bar, Mayfield Bakery is breakfast
  s.restaurants.set("madera", {
    id: "madera",
    name: "Madera",
    cuisine: "Californian / steakhouse",
    hours: "17:00–22:30",
    capacity: 80,
    bookedSlots: [
      { time: "19:00", partySize: 4, reservationId: "res-001" },
      { time: "19:30", partySize: 2, reservationId: "res-002" },
      { time: "20:00", partySize: 6, reservationId: "res-003" },
      { time: "20:30", partySize: 2, reservationId: "res-004" },
      { time: "21:00", partySize: 4, reservationId: "res-005" },
    ],
  });
  s.restaurants.set("madera-bar", {
    id: "madera-bar",
    name: "Madera Bar",
    cuisine: "Cocktails + bar bites",
    hours: "16:00–24:00",
    capacity: 30,
    bookedSlots: [{ time: "19:30", partySize: 2, reservationId: "bar-001" }],
  });
  s.restaurants.set("mayfield", {
    id: "mayfield",
    name: "Mayfield Bakery",
    cuisine: "Breakfast / Italian",
    hours: "07:00–14:00",
    capacity: 50,
    bookedSlots: [],
  });

  // Spa slots — Asaya Spa-style
  const today = new Date();
  const slot = (h: number, m: number, treatment: string, dur: number, therapist: string): SpaSlot => ({
    id: `spa-${h}${m}-${treatment.toLowerCase().replace(/\s+/g, "-")}`,
    treatment,
    durationMin: dur,
    time: new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).toISOString(),
    therapist,
    bookedBy: null,
  });
  [
    slot(10, 0, "Signature Massage", 90, "Mara"),
    slot(11, 30, "Forest Bathing", 60, "Jules"),
    slot(14, 0, "Couples Ritual", 120, "Mara & Jules"),
    slot(16, 0, "Hydrating Facial", 60, "Chen"),
    slot(17, 30, "Foot Reflexology", 45, "Chen"),
  ].forEach((x) => s.spa.set(x.id, x));
}

seed(store);

// Convenience: stamp event listeners with system label for the dashboard trace.
export function watchAll(cb: (e: AuditEntry) => void) {
  store.on("audit", cb);
  return () => store.off("audit", cb);
}
