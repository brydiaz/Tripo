import { SavedTrip } from "@/types/trip";

const STORAGE_KEY = "tripo_saved_trips";

export function getSavedTrips(): SavedTrip[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as SavedTrip[];
  } catch {
    return [];
  }
}

export function saveTrip(trip: SavedTrip) {
  if (typeof window === "undefined") {
    return;
  }

  const currentTrips = getSavedTrips();
  const updatedTrips = [trip, ...currentTrips];

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
}

export function getTripById(id: string): SavedTrip | null {
  const trips = getSavedTrips();
  return trips.find((trip) => trip.id === id) ?? null;
}

export function deleteTripById(id: string) {
  if (typeof window === "undefined") {
    return;
  }

  const currentTrips = getSavedTrips();
  const updatedTrips = currentTrips.filter((trip) => trip.id !== id);

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
}

export function clearAllTrips() {
  if (typeof window === "undefined") {
    return;
  }

  localStorage.removeItem(STORAGE_KEY);
}

export function renameTripById(id: string, newTitle: string) {
  if (typeof window === "undefined") {
    return;
  }

  const currentTrips = getSavedTrips();
  const updatedTrips = currentTrips.map((trip) =>
    trip.id === id
      ? {
          ...trip,
          title: newTitle,
        }
      : trip
  );

  localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedTrips));
}